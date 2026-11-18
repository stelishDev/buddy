import * as Speech from "expo-speech";
import { useSyncExternalStore } from "react";

/**
 * Text-to-speech using the phone's built-in voices (expo-speech).
 * Free, offline, no extra download. Users can install higher-quality
 * "Enhanced"/"Premium" voices in iOS Settings → Accessibility → Spoken Content.
 *
 * One utterance plays at a time. `useSpeakingId()` tells the UI which item
 * (message id, "notes", ...) is being read, so the mic can pause meanwhile.
 */

export interface SpeakOptions {
  /** Voice identifier from `Speech.getAvailableVoicesAsync()`. */
  voice?: string;
  rate?: number;
  language?: string;
}

let currentId: string | null = null;
let token = 0;
const listeners = new Set<() => void>();

const setCurrent = (id: string | null) => {
  currentId = id;
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Id of the item currently being spoken, or null. */
export const useSpeakingId = () => useSyncExternalStore(subscribe, () => currentId);

/** Turns the markdown the AI returns into something that reads naturally aloud. */
export function toSpeakable(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*#{1,6}\s+/, "")
        .replace(/^\s*[-*•]\s+\[[ xX]\]\s+/, "")
        .replace(/^\s*(?:[-*•]|\d+\.)\s+/, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/[*_`>#|]/g, "")
        .replace(/⚠️/g, "")
        .trim(),
    )
    .filter(Boolean)
    .map((line) => (/[.!?:;,]$/.test(line) ? line : `${line}.`)) // pause between lines
    .join(" ");
}

/** Android limits each utterance (~4000 chars), so split long text on sentence boundaries. */
function chunk(text: string): string[] {
  const max = Math.min(Speech.maxSpeechInputLength || 4000, 3000);
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur.length + s.length > max && cur) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s.length > max ? s.slice(0, max) : s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export async function stopSpeaking(): Promise<void> {
  token++; // ignore callbacks from anything already queued
  if (currentId !== null) setCurrent(null);
  await Speech.stop();
}

export async function speak(id: string, text: string, opts: SpeakOptions = {}): Promise<void> {
  await stopSpeaking();
  const chunks = chunk(toSpeakable(text));
  if (!chunks.length) return;

  const mine = ++token;
  const finish = () => {
    if (mine === token) setCurrent(null);
  };
  setCurrent(id);
  chunks.forEach((c, i) =>
    Speech.speak(c, {
      voice: opts.voice,
      rate: opts.rate,
      language: opts.voice ? undefined : opts.language,
      onDone: i === chunks.length - 1 ? finish : undefined,
      onStopped: finish,
      onError: finish,
    }),
  );
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  enhanced: boolean;
}

/** Installed voices for a language (e.g. "en-NZ" matches every "en-*" voice), best first. */
export async function listVoices(language: string): Promise<VoiceOption[]> {
  const prefix = language.split("-")[0].toLowerCase();
  const voices = await Speech.getAvailableVoicesAsync();
  return voices
    .filter((v) => v.language?.toLowerCase().startsWith(prefix))
    .map((v) => ({
      id: v.identifier,
      name: v.name || v.identifier,
      language: v.language,
      enhanced: v.quality === Speech.VoiceQuality.Enhanced,
    }))
    .sort(
      (a, b) =>
        Number(b.enhanced) - Number(a.enhanced) ||
        Number(b.language === language) - Number(a.language === language) ||
        a.name.localeCompare(b.name),
    );
}
