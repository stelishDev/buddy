import { useCallback, useRef, useState } from "react";
import { streamChat } from "@/lib/ai/client";
import type { ChatMessage } from "@/lib/ai/types";
import { uid } from "@/lib/id";
import {
  assistantSystem,
  autoAnswerPrompt,
  formatTranscript,
  notesUserPrompt,
  NOTES_SYSTEM,
} from "@/lib/prompts";
import { getApiKey } from "@/lib/secureKeys";
import { useActiveProvider } from "@/store/providers";
import { useSessions, type QAMessage } from "@/store/sessions";

const HISTORY_LIMIT = 10;

const toPrompt = (m: QAMessage): ChatMessage => ({
  role: m.role,
  content: m.role === "user" && m.source === "auto" ? autoAnswerPrompt(m.content) : m.content,
});

/** AI actions for one meeting session: ask questions and keep running notes. */
export function useAssistant(sessionId: string) {
  const provider = useActiveProvider();
  const [streaming, setStreaming] = useState<Record<string, string>>({});
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [notesBusy, setNotesBusy] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const notesBusyRef = useRef(false);

  const getSession = () => useSessions.getState().sessions.find((s) => s.id === sessionId);

  const ask = useCallback(
    async (question: string, source: "typed" | "auto" = "typed") => {
      const store = useSessions.getState();
      const session = getSession();
      if (!session || !question.trim()) return;

      const history = session.messages.filter((m) => !m.pending && !m.error).slice(-HISTORY_LIMIT);
      const userMsg: QAMessage = { id: uid(), role: "user", content: question.trim(), source, at: Date.now() };
      const replyId = uid();
      store.addMessage(sessionId, userMsg);
      store.addMessage(sessionId, { id: replyId, role: "assistant", content: "", at: Date.now(), pending: true });

      if (!provider) {
        store.updateMessage(sessionId, replyId, {
          pending: false,
          error: true,
          content: "No AI account set up yet. Add one in Settings.",
        });
        return;
      }

      let acc = "";
      try {
        const apiKey = await getApiKey(provider.id);
        const full = await streamChat(provider, apiKey, {
          system: assistantSystem(formatTranscript(session.segments, session.createdAt), session.notes),
          messages: [...history.map(toPrompt), toPrompt(userMsg)],
          onToken: (t) => {
            acc += t;
            setStreaming((s) => ({ ...s, [replyId]: acc }));
          },
        });
        store.updateMessage(sessionId, replyId, { content: full || acc || "(no reply)", pending: false });
      } catch (e: any) {
        store.updateMessage(sessionId, replyId, {
          content: acc ? `${acc}\n\n⚠️ ${e?.message ?? e}` : String(e?.message ?? e),
          pending: false,
          error: !acc,
        });
      } finally {
        setStreaming(({ [replyId]: _, ...rest }) => rest);
      }
    },
    [provider, sessionId],
  );

  /** Merge new transcript into the notes. `force` re-runs even with no new speech. */
  const refreshNotes = useCallback(
    async (force = false) => {
      const session = getSession();
      if (!session || !provider || notesBusyRef.current) return;
      const newSegments = session.segments.slice(session.notesSegmentCount);
      if (newSegments.length === 0 && !(force && session.segments.length)) return;

      const segmentCount = session.segments.length;
      const newText = formatTranscript(
        newSegments.length ? newSegments : session.segments,
        session.createdAt,
        20000,
      );

      notesBusyRef.current = true;
      setNotesBusy(true);
      setNotesError(null);
      let acc = "";
      try {
        const apiKey = await getApiKey(provider.id);
        const full = await streamChat(provider, apiKey, {
          system: NOTES_SYSTEM,
          messages: [{ role: "user", content: notesUserPrompt(session.notes, newText) }],
          maxTokens: 1500,
          onToken: (t) => {
            acc += t;
            setNotesDraft(acc);
          },
        });
        if (full.trim()) useSessions.getState().setNotes(sessionId, full.trim(), segmentCount);
      } catch (e: any) {
        setNotesError(String(e?.message ?? e));
      } finally {
        notesBusyRef.current = false;
        setNotesBusy(false);
        setNotesDraft(null);
      }
    },
    [provider, sessionId],
  );

  return { provider, ask, streaming, refreshNotes, notesDraft, notesBusy, notesError };
}
