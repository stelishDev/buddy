import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Button, Chip, Field } from "@/components/ui";
import { listModels, testConnection } from "@/lib/ai/client";
import { DEFAULT_BASE_URL, KIND_LABEL, PRESETS, type ProviderPreset } from "@/lib/ai/presets";
import type { ProviderConfig } from "@/lib/ai/types";
import { uid } from "@/lib/id";
import { getApiKey, setApiKey } from "@/lib/secureKeys";
import { useProviders } from "@/store/providers";

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useProviders((s) => s.providers.find((p) => p.id === id));
  const upsert = useProviders((s) => s.upsert);
  const remove = useProviders((s) => s.remove);
  const setActive = useProviders((s) => s.setActive);

  const [preset, setPreset] = useState<ProviderPreset | null>(existing ? null : PRESETS[0]);
  const [name, setName] = useState(existing?.name ?? PRESETS[0].label);
  const [kind, setKind] = useState(existing?.kind ?? PRESETS[0].kind);
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? PRESETS[0].baseUrl);
  const [model, setModel] = useState(existing?.model ?? "");
  const [apiKey, setKey] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelFilter, setModelFilter] = useState("");
  const [busy, setBusy] = useState<"models" | "test" | "save" | null>(null);

  useEffect(() => {
    if (existing) getApiKey(existing.id).then((k) => setHasSavedKey(!!k));
  }, [existing]);

  const choosePreset = (p: ProviderPreset) => {
    setPreset(p);
    setName(p.label);
    setKind(p.kind);
    setBaseUrl(p.baseUrl);
    setModel("");
    setModels([]);
  };

  const draft = (): ProviderConfig => ({
    id: existing?.id ?? "draft",
    name: name.trim() || KIND_LABEL[kind],
    kind,
    baseUrl: baseUrl.trim() || DEFAULT_BASE_URL[kind],
    model: model.trim(),
    createdAt: existing?.createdAt ?? Date.now(),
  });

  /** Key typed in the form wins; otherwise fall back to the saved one. */
  const effectiveKey = async () => apiKey.trim() || (existing ? await getApiKey(existing.id) : null);

  const loadModels = async () => {
    setBusy("models");
    try {
      const list = await listModels(draft(), await effectiveKey());
      setModels(list);
      if (!list.length) Alert.alert("No models returned", "Type the model id manually.");
    } catch (e: any) {
      Alert.alert("Couldn't load models", String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    if (!model.trim()) return Alert.alert("Pick a model first");
    setBusy("test");
    try {
      const reply = await testConnection(draft(), await effectiveKey());
      Alert.alert("It works ✅", `Model replied: ${reply.slice(0, 120)}`);
    } catch (e: any) {
      Alert.alert("Connection failed", String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    const needsKey = preset?.keyRequired ?? kind !== "openai-compatible";
    if (!model.trim()) return Alert.alert("Model required", "Enter a model id or tap Load models.");
    if (kind === "openai-compatible" && !baseUrl.trim()) return Alert.alert("Base URL required");
    if (needsKey && !apiKey.trim() && !hasSavedKey) return Alert.alert("API key required");

    setBusy("save");
    try {
      const config = { ...draft(), id: existing?.id ?? uid() };
      if (apiKey.trim()) await setApiKey(config.id, apiKey.trim());
      upsert(config);
      if (!existing) setActive(config.id);
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save", String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () =>
    existing &&
    Alert.alert("Remove account?", `${existing.name} and its stored API key will be deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          remove(existing.id);
          router.back();
        },
      },
    ]);

  const filteredModels = useMemo(
    () => models.filter((m) => m.toLowerCase().includes(modelFilter.toLowerCase())).slice(0, 60),
    [models, modelFilter],
  );
  const showBaseUrl = kind === "openai-compatible" || !!existing || preset?.label.startsWith("Custom");

  return (
    <KeyboardAvoidingView className="flex-1 bg-zinc-950" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="p-4 pb-12" keyboardShouldPersistTaps="handled">
        {!existing ? (
          <View className="mb-5">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Provider</Text>
            <View className="flex-row flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Chip key={p.label} label={p.label} active={preset?.label === p.label} onPress={() => choosePreset(p)} />
              ))}
            </View>
          </View>
        ) : (
          <Text className="mb-4 text-sm text-zinc-500">{KIND_LABEL[kind]} API</Text>
        )}

        <Field label="Display name" value={name} onChangeText={setName} autoCapitalize="words" />

        {showBaseUrl ? (
          <Field
            label="Base URL"
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="https://…/v1"
            keyboardType="url"
            hint={kind === "openai-compatible" ? "Any endpoint that speaks the OpenAI chat completions API." : undefined}
          />
        ) : null}

        <Field
          label={`API key${preset && !preset.keyRequired ? " (optional)" : ""}`}
          value={apiKey}
          onChangeText={setKey}
          placeholder={hasSavedKey ? "•••••••• saved — leave blank to keep" : "Paste your key"}
          secureTextEntry
          hint={preset?.keyHelp}
        />

        <Field label="Model" value={model} onChangeText={setModel} placeholder={preset?.modelHint ?? "Model id"} />

        <Button
          title="Load models"
          icon="list-outline"
          variant="secondary"
          loading={busy === "models"}
          onPress={loadModels}
          className="mb-3"
        />

        {models.length ? (
          <View className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            {models.length > 12 ? (
              <Field label="Filter" value={modelFilter} onChangeText={setModelFilter} placeholder="e.g. mini, sonnet, flash" />
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              {filteredModels.map((m) => (
                <Chip key={m} label={m} active={model === m} onPress={() => setModel(m)} />
              ))}
            </View>
          </View>
        ) : null}

        <View className="mt-2 gap-3">
          <Button title="Test connection" icon="pulse-outline" variant="secondary" loading={busy === "test"} onPress={test} />
          <Button title="Save" icon="checkmark" loading={busy === "save"} onPress={save} />
          {existing ? <Button title="Remove account" variant="danger" icon="trash-outline" onPress={confirmDelete} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
