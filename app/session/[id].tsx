import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatView } from "@/components/ChatView";
import { Composer } from "@/components/Composer";
import { MicButton } from "@/components/MicButton";
import { NotesView } from "@/components/NotesView";
import { Tabs } from "@/components/Tabs";
import { TranscriptView } from "@/components/TranscriptView";
import { EmptyState } from "@/components/ui";
import { useAssistant } from "@/hooks/useAssistant";
import { useMeetingListener } from "@/hooks/useMeetingListener";
import { isLikelyQuestion } from "@/lib/prompts";
import { speak, stopSpeaking, useSpeakingId } from "@/lib/tts";
import { useSessions } from "@/store/sessions";
import { useSettings } from "@/store/settings";

type Tab = "live" | "notes" | "ask";
const AUTO_ANSWER_COOLDOWN_MS = 20_000;

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessions((s) => s.sessions.find((x) => x.id === id));
  const addSegment = useSessions((s) => s.addSegment);
  const rename = useSessions((s) => s.rename);
  const settings = useSettings();
  const assistant = useAssistant(id);

  const [tab, setTab] = useState<Tab>("live");
  const [unseenAnswers, setUnseenAnswers] = useState(0);
  const lastAutoAnswer = useRef(0);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const speakingId = useSpeakingId();

  const speakOptions = () => {
    const s = useSettings.getState();
    return { voice: s.ttsVoice, rate: s.ttsRate, language: s.language };
  };
  const toggleSpeak = (itemId: string, text: string) =>
    speakingId === itemId ? stopSpeaking() : speak(itemId, text, speakOptions());

  /** Ask the AI, then read the answer aloud if that setting is on. */
  const askAndRead = async (q: string, source: "typed" | "auto") => {
    const answer = await assistant.ask(q, source);
    if (answer && useSettings.getState().readAnswersAloud) speak(answer.id, answer.text, speakOptions());
  };

  const listener = useMeetingListener({
    lang: settings.language,
    onDeviceOnly: settings.onDeviceOnly,
    onFinal: (text) => {
      addSegment(id, text);
      const now = Date.now();
      if (
        settings.autoAnswer &&
        isLikelyQuestion(text) &&
        now - lastAutoAnswer.current > AUTO_ANSWER_COOLDOWN_MS
      ) {
        lastAutoAnswer.current = now;
        askAndRead(text, "auto");
        if (tabRef.current !== "ask") setUnseenAnswers((n) => n + 1);
      }
    },
  });

  // Keep notes fresh while listening.
  const refreshRef = useRef(assistant.refreshNotes);
  refreshRef.current = assistant.refreshNotes;
  useEffect(() => {
    if (!listener.listening || !settings.autoNotes) return;
    const timer = setInterval(() => refreshRef.current(false), settings.notesIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [listener.listening, settings.autoNotes, settings.notesIntervalSec]);

  // Don't transcribe our own voice: pause the mic while reading aloud.
  const { pause: pauseMic, resume: resumeMic } = listener;
  useEffect(() => {
    if (speakingId && settings.pauseMicWhileSpeaking) pauseMic();
    else resumeMic();
  }, [speakingId, settings.pauseMicWhileSpeaking, listener.listening, pauseMic, resumeMic]);

  // Stop talking when leaving the meeting.
  useEffect(() => () => void stopSpeaking(), []);

  const toggleMic = () => {
    if (listener.listening) {
      listener.stop();
      // Capture whatever was said since the last notes update.
      setTimeout(() => refreshRef.current(false), 1200);
    } else {
      listener.start();
    }
  };

  const changeTab = (t: Tab) => {
    setTab(t);
    if (t === "ask") setUnseenAnswers(0);
  };

  const askTyped = (q: string) => {
    changeTab("ask");
    askAndRead(q, "typed");
  };

  if (!session) return <EmptyState icon="alert-circle-outline" title="Meeting not found" />;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-zinc-950">
      <Stack.Screen options={{ title: "" }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View className="px-4 pb-3">
          <TextInput
            value={session.title}
            onChangeText={(t) => rename(id, t)}
            className="mb-3 text-2xl font-bold text-zinc-50"
            placeholder="Meeting title"
            placeholderTextColor="#52525b"
          />
          <View className="flex-row items-center justify-between">
            <MicButton listening={listener.listening} paused={listener.paused} onPress={toggleMic} />
            {assistant.provider ? (
              <Link href="/settings" asChild>
                <Pressable className="max-w-[45%] flex-row items-center gap-1 rounded-full border border-zinc-800 px-3 py-1.5">
                  <Ionicons name="sparkles" size={12} color="#a5b4fc" />
                  <Text className="text-xs text-zinc-400" numberOfLines={1}>
                    {assistant.provider.model || assistant.provider.name}
                  </Text>
                </Pressable>
              </Link>
            ) : (
              <Link href="/settings/provider" asChild>
                <Pressable className="rounded-full bg-indigo-500/20 px-3 py-1.5">
                  <Text className="text-xs font-semibold text-indigo-200">Add AI account</Text>
                </Pressable>
              </Link>
            )}
          </View>
          {listener.error ? (
            <Text className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{listener.error}</Text>
          ) : null}
        </View>

        <Tabs
          value={tab}
          onChange={changeTab}
          tabs={[
            { key: "live", label: "Transcript" },
            { key: "notes", label: "Notes" },
            { key: "ask", label: "Ask", badge: unseenAnswers },
          ]}
        />

        <View className="flex-1">
          {tab === "live" ? (
            <TranscriptView
              segments={session.segments}
              interim={listener.interim}
              startedAt={session.createdAt}
              listening={listener.listening}
            />
          ) : tab === "notes" ? (
            <NotesView
              title={session.title}
              notes={session.notes}
              draft={assistant.notesDraft}
              busy={assistant.notesBusy}
              error={assistant.notesError}
              updatedAt={session.notesUpdatedAt}
              hasTranscript={session.segments.length > 0}
              speaking={speakingId === "notes"}
              onRefresh={() => assistant.refreshNotes(true)}
              onToggleSpeak={() => toggleSpeak("notes", session.notes)}
            />
          ) : (
            <ChatView
              messages={session.messages}
              streaming={assistant.streaming}
              speakingId={speakingId}
              onSuggestion={askTyped}
              onToggleSpeak={toggleSpeak}
            />
          )}
        </View>

        <Composer onSend={askTyped} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
