import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { uid } from "@/lib/id";

export interface Segment {
  id: string;
  text: string;
  at: number;
}

export interface QAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** "auto" = question detected in the meeting audio. */
  source?: "typed" | "auto";
  at: number;
  pending?: boolean;
  error?: boolean;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  segments: Segment[];
  notes: string;
  notesUpdatedAt?: number;
  /** How many segments were included in the last notes update. */
  notesSegmentCount: number;
  messages: QAMessage[];
}

interface SessionsState {
  sessions: Session[];
  create: () => string;
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  addSegment: (id: string, text: string) => void;
  setNotes: (id: string, notes: string, segmentCount: number) => void;
  addMessage: (id: string, msg: QAMessage) => void;
  updateMessage: (id: string, msgId: string, patch: Partial<QAMessage>) => void;
  clearChat: (id: string) => void;
}

const patchSession = (sessions: Session[], id: string, fn: (s: Session) => Partial<Session>) =>
  sessions.map((s) => (s.id === id ? { ...s, ...fn(s), updatedAt: Date.now() } : s));

export const useSessions = create<SessionsState>()(
  persist(
    (set) => ({
      sessions: [],
      create: () => {
        const now = Date.now();
        const id = uid();
        const date = new Date(now);
        const title = `Meeting ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        set((s) => ({
          sessions: [
            { id, title, createdAt: now, updatedAt: now, segments: [], notes: "", notesSegmentCount: 0, messages: [] },
            ...s.sessions,
          ],
        }));
        return id;
      },
      rename: (id, title) => set((s) => ({ sessions: patchSession(s.sessions, id, () => ({ title })) })),
      remove: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      addSegment: (id, text) =>
        set((s) => ({
          sessions: patchSession(s.sessions, id, (x) => ({
            segments: [...x.segments, { id: uid(), text, at: Date.now() }],
          })),
        })),
      setNotes: (id, notes, segmentCount) =>
        set((s) => ({
          sessions: patchSession(s.sessions, id, () => ({
            notes,
            notesSegmentCount: segmentCount,
            notesUpdatedAt: Date.now(),
          })),
        })),
      addMessage: (id, msg) =>
        set((s) => ({ sessions: patchSession(s.sessions, id, (x) => ({ messages: [...x.messages, msg] })) })),
      updateMessage: (id, msgId, patch) =>
        set((s) => ({
          sessions: patchSession(s.sessions, id, (x) => ({
            messages: x.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
          })),
        })),
      clearChat: (id) => set((s) => ({ sessions: patchSession(s.sessions, id, () => ({ messages: [] })) })),
    }),
    {
      name: "sessions-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ sessions: s.sessions }),
      // Any answer that was mid-stream when the app closed is marked as interrupted.
      onRehydrateStorage: () => (state) => {
        state?.sessions.forEach((sess) =>
          sess.messages.forEach((m) => {
            if (m.pending) {
              m.pending = false;
              m.error = true;
              m.content = m.content || "Interrupted.";
            }
          }),
        );
      },
    },
  ),
);
