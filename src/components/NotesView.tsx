import { ActivityIndicator, ScrollView, Share, Text, View } from "react-native";
import { MarkdownLite } from "./MarkdownLite";
import { Button, EmptyState } from "./ui";

export function NotesView({
  title,
  notes,
  draft,
  busy,
  error,
  updatedAt,
  hasTranscript,
  onRefresh,
}: {
  title: string;
  notes: string;
  draft: string | null;
  busy: boolean;
  error: string | null;
  updatedAt?: number;
  hasTranscript: boolean;
  onRefresh: () => void;
}) {
  const shown = draft ?? notes;

  return (
    <ScrollView contentContainerClassName="px-4 py-3 pb-8">
      <View className="mb-3 flex-row items-center gap-2">
        <Button
          title={busy ? "Updating…" : "Update notes"}
          icon="refresh"
          variant="secondary"
          loading={busy}
          disabled={!hasTranscript}
          onPress={onRefresh}
          className="flex-1"
        />
        <Button
          title="Share"
          icon="share-outline"
          variant="secondary"
          disabled={!notes}
          onPress={() => Share.share({ title, message: `${title}\n\n${notes}` })}
        />
      </View>

      {error ? <Text className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</Text> : null}

      {shown ? (
        <>
          <MarkdownLite text={shown} />
          {busy ? (
            <ActivityIndicator className="mt-3 self-start" color="#818cf8" />
          ) : updatedAt ? (
            <Text className="mt-4 text-xs text-zinc-500">
              Updated {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon="document-text-outline"
          title="No notes yet"
          body="Notes are written automatically while you listen, or tap Update notes."
        />
      )}
    </ScrollView>
  );
}
