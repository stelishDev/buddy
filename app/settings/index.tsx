import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Chip, Section, ToggleRow } from "@/components/ui";
import { KIND_LABEL } from "@/lib/ai/presets";
import { useProviders } from "@/store/providers";
import { useSettings } from "@/store/settings";

const INTERVALS = [30, 60, 120, 300];
const LANGUAGES = ["en-NZ", "en-AU", "en-GB", "en-US"];

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

      <Text className="px-1 text-xs leading-5 text-zinc-500">
        API keys are stored in the device keychain and sent only to the provider you choose. Transcripts and notes are
        stored on this device. Always let people know when a meeting is being transcribed — in many places it's a legal
        requirement.
      </Text>
    </ScrollView>
  );
}
