import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import type { QAMessage } from "@/store/sessions";
import { MarkdownLite } from "./MarkdownLite";
import { Chip } from "./ui";

const SUGGESTIONS = [
  "Summarise the meeting so far",
  "What are the action items?",
  "What should I ask next?",
  "Explain the last point in simple terms",
];

export function ChatView({
  messages,
  streaming,
  speakingId,
  onSuggestion,
  onToggleSpeak,
}: {
  messages: QAMessage[];
  streaming: Record<string, string>;
  speakingId: string | null;
  onSuggestion: (q: string) => void;
  onToggleSpeak: (id: string, text: string) => void;
}) {
  const listRef = useRef<FlatList<QAMessage>>(null);

  if (!messages.length)
    return (
      <View className="flex-1 justify-end px-4 pb-4">
        <Ionicons name="sparkles-outline" size={28} color="#818cf8" />
        <Text className="mb-1 mt-2 text-lg font-semibold text-zinc-100">Ask about the meeting</Text>
        <Text className="mb-4 text-sm text-zinc-500">
          Answers use the live transcript and notes. Try one of these:
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Chip key={s} label={s} onPress={() => onSuggestion(s)} />
          ))}
        </View>
      </View>
    );

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerClassName="px-4 py-3"
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      renderItem={({ item }) => {
        if (item.role === "user")
          return (
            <View className="mb-3 max-w-[85%] self-end rounded-2xl rounded-br-md bg-indigo-500 px-4 py-2.5">
              {item.source === "auto" ? (
                <Text className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-100">
                  Heard in meeting
                </Text>
              ) : null}
              <Text selectable className="text-[15px] leading-6 text-white">
                {item.content}
              </Text>
            </View>
          );

        const text = item.pending ? (streaming[item.id] ?? "") : item.content;
        const speaking = speakingId === item.id;
        const canSpeak = !item.pending && !item.error && !!text;
        return (
          <View
            className={`mb-3 max-w-[92%] self-start rounded-2xl rounded-bl-md border px-4 py-2.5 ${
              item.error ? "border-red-500/40 bg-red-500/10" : "border-zinc-800 bg-zinc-900"
            }`}
          >
            {text ? (
              item.error ? (
                <Text className="text-sm text-red-300">{text}</Text>
              ) : (
                <MarkdownLite text={text} />
              )
            ) : (
              <ActivityIndicator color="#818cf8" />
            )}
            {canSpeak ? (
              <Pressable
                onPress={() => onToggleSpeak(item.id, text)}
                hitSlop={8}
                className="mt-1.5 flex-row items-center gap-1 self-start rounded-full py-1 pr-2 active:opacity-60"
              >
                <Ionicons
                  name={speaking ? "stop-circle" : "volume-medium-outline"}
                  size={16}
                  color={speaking ? "#f87171" : "#a1a1aa"}
                />
                <Text className={`text-xs ${speaking ? "text-red-300" : "text-zinc-400"}`}>
                  {speaking ? "Stop" : "Read aloud"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      }}
    />
  );
}
