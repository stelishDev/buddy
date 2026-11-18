import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Chip, Section, ToggleRow } from "@/components/ui";
import { KIND_LABEL } from "@/lib/ai/presets";
import { listVoices, speak, stopSpeaking, useSpeakingId, type VoiceOption } from "@/lib/tts";
import { useProviders } from "@/store/providers";
import { useSettings } from "@/store/settings";

const INTERVALS = [30, 60, 120, 300];
const LANGUAGES = ["en-NZ", "en-AU", "en-GB", "en-US"];
const RATES = [
  { label: "Slow", value: 0.85 },
  { label: "Normal", value: 1 },
  { label: "Fast", value: 1.15 },
  { label: "Faster", value: 1.3 },
];
const MAX_VOICES_SHOWN = 24;
const SAMPLE = "Here's a quick summary. The team agreed to ship on Friday, and Sam owns the follow-up email.";

function VoiceSettings() {
  const settings = useSettings();
  const speakingId = useSpeakingId();
  const [voices, setVoices] = useState<VoiceOption[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(() => {
    setVoices(null);
    listVoices(settings.language)
      .then(setVoices)
      .catch(() => setVoices([]));
  }, [settings.language]);

  useEffect(load, [load]);
  useEffect(() => () => void stopSpeaking(), []);

  const testing = speakingId === "voice-test";
  const test = () =>
    testing
      ? stopSpeaking()
      : speak("voice-test", SAMPLE, { voice: settings.ttsVoice, rate: settings.ttsRate, language: settings.language });

  const shown = voices && !showAll ? voices.slice(0, MAX_VOICES_SHOWN) : voices;

  return (
    <Section title="Read aloud">
      <ToggleRow
        label="Read answers aloud"
        description="Speaks each AI answer when it's ready. You can always tap “Read aloud” on any answer or the notes."
        value={settings.readAnswersAloud}
        onChange={(v) => settings.update({ readAnswersAloud: v })}
      />
      <ToggleRow
        label="Pause the mic while speaking"
        description="Stops the app transcribing its own voice. Turn off if you use earphones, so nothing in the meeting is missed."
        value={settings.pauseMicWhileSpeaking}
        onChange={(v) => settings.update({ pauseMicWhileSpeaking: v })}
      />

      <View className="border-b border-zinc-800 px-4 py-3">
        <Text className="mb-2 text-sm text-zinc-400">Speed</Text>
        <View className="flex-row flex-wrap gap-2">
          {RATES.map((r) => (
            <Chip
              key={r.label}
              label={r.label}
              active={settings.ttsRate === r.value}
              onPress={() => settings.update({ ttsRate: r.value })}
            />
          ))}
        </View>
      </View>

      <View className="px-4 py-3">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm text-zinc-400">Voice ({settings.language.split("-")[0]})</Text>
          <Pressable onPress={load} hitSlop={8}>
            <Ionicons name="refresh" size={16} color="#a1a1aa" />
          </Pressable>
        </View>
        {voices === null ? (
          <ActivityIndicator className="self-start" color="#818cf8" />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            <Chip
              label="System default"
              active={!settings.ttsVoice}
              onPress={() => settings.update({ ttsVoice: undefined })}
            />
            {shown!.map((v) => (
              <Chip
                key={v.id}
                label={`${v.name}${v.enhanced ? " ★" : ""} · ${v.language}`}
                active={settings.ttsVoice === v.id}
                onPress={() => settings.update({ ttsVoice: v.id })}
              />
            ))}
            {voices.length > MAX_VOICES_SHOWN && !showAll ? (
              <Chip label={`+${voices.length - MAX_VOICES_SHOWN} more`} onPress={() => setShowAll(true)} />
            ) : null}
          </View>
        )}
        <Text className="mt-2 text-xs leading-5 text-zinc-500">
          ★ = higher-quality voice.{" "}
          {Platform.OS === "ios"
            ? "Download free Enhanced and Premium voices in iOS Settings → Accessibility → Spoken Content → Voices, then tap refresh."
            : "Install more voices in Android Settings → Accessibility → Text-to-speech output."}
        </Text>
        <Button
          title={testing ? "Stop" : "Test voice"}
          icon={testing ? "stop-circle" : "play"}
          variant={testing ? "danger" : "secondary"}
          onPress={test}
          className="mt-3"
        />
      </View>
    </Section>
  );
}

export default function SettingsScreen() {
  const providers = useProviders((s) => s.providers);
  const activeId = useProviders((s) => s.activeId);
  const setActive = useProviders((s) => s.setActive);
  const settings = useSettings();

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerClassName="p-4 pb-12">
      <Section
        title="AI accounts"
        right={
          <Link href="/settings/provider" asChild>
            <Pressable hitSlop={8} className="flex-row items-center gap-1">
              <Ionicons name="add" size={16} color="#a5b4fc" />
              <Text className="text-sm font-semibold text-indigo-300">Add</Text>
            </Pressable>
          </Link>
        }
      >
        {providers.length === 0 ? (
          <Link href="/settings/provider" asChild>
            <Pressable className="p-4 active:bg-zinc-800">
              <Text className="text-zinc-300">No accounts yet. Tap to add one.</Text>
            </Pressable>
          </Link>
        ) : (
          providers.map((p) => {
            const active = p.id === (activeId ?? providers[0]?.id);
            return (
              <View key={p.id} className="flex-row items-center border-b border-zinc-800">
                <Pressable onPress={() => setActive(p.id)} className="flex-1 flex-row items-center gap-3 p-4 active:bg-zinc-800">
                  <Ionicons
                    name={active ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={active ? "#818cf8" : "#52525b"}
                  />
                  <View className="flex-1">
                    <Text className="text-base text-zinc-100">{p.name}</Text>
                    <Text className="text-xs text-zinc-500" numberOfLines={1}>
                      {KIND_LABEL[p.kind]} · {p.model || "no model set"}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => router.push({ pathname: "/settings/provider", params: { id: p.id } })}
                  className="px-4 py-4"
                >
                  <Ionicons name="create-outline" size={20} color="#a1a1aa" />
                </Pressable>
              </View>
            );
          })
        )}
      </Section>

      <Section title="Assistant">
        <ToggleRow
          label="Auto-update notes"
          description="Rewrites the running notes while the mic is on."
          value={settings.autoNotes}
          onChange={(v) => settings.update({ autoNotes: v })}
        />
        {settings.autoNotes ? (
          <View className="border-b border-zinc-800 px-4 py-3">
            <Text className="mb-2 text-sm text-zinc-400">Update every</Text>
            <View className="flex-row flex-wrap gap-2">
              {INTERVALS.map((s) => (
                <Chip
                  key={s}
                  label={s < 60 ? `${s}s` : `${s / 60} min`}
                  active={settings.notesIntervalSec === s}
                  onPress={() => settings.update({ notesIntervalSec: s })}
                />
              ))}
            </View>
          </View>
        ) : null}
        <ToggleRow
          label="Answer questions heard in the meeting"
          description="When someone asks a question out loud, suggest an answer in the Ask tab."
          value={settings.autoAnswer}
          onChange={(v) => settings.update({ autoAnswer: v })}
        />
      </Section>

      <Section title="Speech recognition">
        <View className="border-b border-zinc-800 px-4 py-3">
          <Text className="mb-2 text-sm text-zinc-400">Language</Text>
          <View className="mb-2 flex-row flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <Chip key={l} label={l} active={settings.language === l} onPress={() => settings.update({ language: l })} />
            ))}
          </View>
          <TextInput
            value={settings.language}
            onChangeText={(t) => settings.update({ language: t.trim() })}
            placeholder="BCP-47 tag, e.g. fr-FR"
            placeholderTextColor="#71717a"
            autoCapitalize="none"
            autoCorrect={false}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </View>
        <ToggleRow
          label="On-device only"
          description="Keeps audio on the phone. Needs the language's offline model installed; accuracy can be lower."
          value={settings.onDeviceOnly}
          onChange={(v) => settings.update({ onDeviceOnly: v })}
        />
      </Section>

      <VoiceSettings />

      <Text className="px-1 text-xs leading-5 text-zinc-500">
        API keys are stored in the device keychain and sent only to the provider you choose. Transcripts and notes are
        stored on this device. Always let people know when a meeting is being transcribed — in many places it's a legal
        requirement.
      </Text>
    </ScrollView>
  );
}
