import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const KEEP_AWAKE_TAG = "meeting-listener";
const RESTART_DELAY_MS = 250;
const MAX_CONSECUTIVE_ERRORS = 5;
const IGNORABLE_ERRORS = new Set(["no-speech", "speech-timeout", "aborted"]);

interface Options {
  lang: string;
  onDeviceOnly: boolean;
  /** Called with each finalised utterance. */
  onFinal: (text: string) => void;
}

/**
 * Long-running meeting transcription on top of the OS speech recogniser.
 *
 * - Android 13+: true continuous mode, one final result per utterance.
 * - iOS: non-continuous mode, which ends after ~3s of silence. We restart it
 *   immediately, which gives natural sentence-sized segments and sidesteps
 *   iOS's per-request duration limit.
 * - Whenever the engine ends while the user still wants to listen, we restart.
 */
export function useMeetingListener({ lang, onDeviceOnly, onFinal }: Options) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wantRef = useRef(false);
  const interimRef = useRef("");
  const errorCountRef = useRef(0);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const startEngine = useCallback(() => {
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      continuous: Platform.OS !== "ios",
      addsPunctuation: true,
      requiresOnDeviceRecognition: onDeviceOnly,
      iosTaskHint: "dictation",
      iosCategory: {
        category: "playAndRecord",
        categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
        mode: "measurement",
      },
    });
  }, [lang, onDeviceOnly]);

  const commitInterim = () => {
    const text = interimRef.current.trim();
    interimRef.current = "";
    setInterim("");
    if (text) onFinalRef.current(text);
  };

  const scheduleRestart = (delay = RESTART_DELAY_MS) => {
    if (restartTimer.current) clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => {
      if (wantRef.current) startEngine();
    }, delay);
  };

  useSpeechRecognitionEvent("start", () => {
    setListening(true);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    if (event.isFinal) {
      interimRef.current = "";
      setInterim("");
      if (text.trim()) onFinalRef.current(text.trim());
      errorCountRef.current = 0;
    } else {
      interimRef.current = text;
      setInterim(text);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    commitInterim();
    if (wantRef.current) scheduleRestart();
    else setListening(false);
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (IGNORABLE_ERRORS.has(event.error)) return; // "end" will follow and restart us
    if (event.error === "not-allowed") {
      wantRef.current = false;
      setListening(false);
      setError("Microphone or speech recognition permission was denied. Enable it in system settings.");
      return;
    }
    errorCountRef.current += 1;
    if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
      wantRef.current = false;
      setListening(false);
      deactivateKeepAwake(KEEP_AWAKE_TAG);
      setError(`Speech recognition stopped: ${event.message || event.error}`);
    } else {
      // back off a little before the "end"-triggered restart
      scheduleRestart(RESTART_DELAY_MS * errorCountRef.current * 2);
    }
  });

  const start = useCallback(async () => {
    setError(null);
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setError("Speech recognition isn't available on this device.");
      return;
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setError("Microphone permission is needed to listen to the meeting.");
      return;
    }
    wantRef.current = true;
    errorCountRef.current = 0;
    await activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    startEngine();
  }, [startEngine]);

  const stop = useCallback(() => {
    wantRef.current = false;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    ExpoSpeechRecognitionModule.stop();
    deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, []);

  // Stop the mic if the screen unmounts while listening.
  useEffect(
    () => () => {
      if (wantRef.current) {
        wantRef.current = false;
        if (restartTimer.current) clearTimeout(restartTimer.current);
        ExpoSpeechRecognitionModule.abort();
        deactivateKeepAwake(KEEP_AWAKE_TAG);
      }
    },
    [],
  );

  return { listening, interim, error, start, stop };
}
