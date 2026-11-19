import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, router } from "expo-router";
import { useMemo } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, EmptyState } from "@/components/ui";
import { useActiveProvider } from "@/store/providers";
import { useSessions, type Session } from "@/store/sessions";

export default function Home() {
  const sessions = useSessions((s) => s.sessions);
  const create = useSessions((s) => s.create);
  const remove = useSessions((s) => s.remove);
  const provider = useActiveProvider();

  const sorted = useMemo(() => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt), [sessions]);

  const startNew = () => {
    const id = create();
    router.push({ pathname: "/session/[id]", params: { id } });
  };

  const confirmDelete = (s: Session) =>
    Alert.alert("Delete meeting?", s.title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove(s.id) },
    ]);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-zinc-950">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable hitSlop={10}>
                <Ionicons name="settings-outline" size={22} color="#e4e4e7" />
              </Pressable>
            </Link>
          ),
        }}
      />

      {!provider ? (
        <Link href="/settings/provider" asChild>
          <Pressable className="mx-4 mt-2 flex-row items-center gap-3 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-4">
            <Ionicons name="key-outline" size={22} color="#a5b4fc" />
            <View className="flex-1">
              <Text className="font-semibold text-indigo-100">Connect an AI account</Text>
              <Text className="text-sm text-indigo-200/70">
                OpenAI, Claude, Gemini, OpenRouter, Groq, local models and more.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#a5b4fc" />
          </Pressable>
        </Link>
      ) : null}

      <FlatList
        data={sorted}
        keyExtractor={(s) => s.id}
        contentContainerClassName="p-4 grow"
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No meetings yet"
            body="Start a session, turn on the mic, and MeMate will transcribe, take notes and answer questions."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/session/[id]", params: { id: item.id } })}
            onLongPress={() => confirmDelete(item)}
            className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 active:bg-zinc-800"
          >
            <Text className="text-base font-semibold text-zinc-100" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="mt-1 text-sm text-zinc-500" numberOfLines={2}>
              {item.notes
                ? item.notes.replace(/^#+\s*/gm, "").replace(/\n+/g, " ").slice(0, 160)
                : `${item.segments.length} transcript lines · ${item.messages.filter((m) => m.role === "user").length} questions`}
            </Text>
            <Text className="mt-2 text-xs text-zinc-600">{new Date(item.updatedAt).toLocaleString()}</Text>
          </Pressable>
        )}
      />

      <View className="px-4 pb-2">
        <Button title="New meeting session" icon="add" onPress={startNew} />
      </View>
    </SafeAreaView>
  );
}
