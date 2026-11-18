import { useRef } from "react";
import { FlatList, Text, View } from "react-native";
import type { Segment } from "@/store/sessions";
import { EmptyState } from "./ui";

const clock = (startedAt: number, at: number) => {
  const s = Math.max(0, Math.round((at - startedAt) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function TranscriptView({
  segments,
  interim,
  startedAt,
  listening,
}: {
  segments: Segment[];
  interim: string;
  startedAt: number;
  listening: boolean;
}) {
  const listRef = useRef<FlatList<Segment>>(null);

  if (!segments.length && !interim)
    return (
      <EmptyState
        icon={listening ? "ear-outline" : "mic-outline"}
        title={listening ? "Listening…" : "No transcript yet"}
        body={
          listening
            ? "Speech will appear here as it's recognised."
            : "Tap the mic to start listening. Make sure everyone in the meeting is OK with it being transcribed."
        }
      />
    );

  return (
    <FlatList
      ref={listRef}
      data={segments}
      keyExtractor={(s) => s.id}
      contentContainerClassName="px-4 py-3"
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      renderItem={({ item }) => (
        <View className="mb-3 flex-row gap-3">
          <Text className="w-11 pt-0.5 font-mono text-xs text-zinc-500">{clock(startedAt, item.at)}</Text>
          <Text selectable className="flex-1 text-[15px] leading-6 text-zinc-200">
            {item.text}
          </Text>
        </View>
      )}
      ListFooterComponent={
        interim ? (
          <View className="mb-3 flex-row gap-3">
            <Text className="w-11 pt-0.5 font-mono text-xs text-indigo-400">live</Text>
            <Text className="flex-1 text-[15px] italic leading-6 text-zinc-400">{interim}</Text>
          </View>
        ) : null
      }
    />
  );
}
