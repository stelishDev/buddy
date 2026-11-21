import { useSessions, type Session } from "@/store/sessions";
import EavesWidget from "./EavesWidget";
import { EMPTY_WIDGET_PROPS, type EavesWidgetProps } from "./types";

const DEBOUNCE_MS = 1500;
const MAX_ACTIONS = 5;

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
const plain = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/[*_`#]/g, "").trim();

/** Splits the AI notes ("## Summary", "## Action items", …) into sections keyed by lower-case heading. */
function parseNotes(notes: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current = "";
  for (const line of notes.split("\n")) {
    const heading = line.match(/^\s*#{1,4}\s+(.*)$/);
    if (heading) {
      current = heading[1].trim().toLowerCase();
      sections[current] = [];
    } else if (current && line.trim()) {
      sections[current].push(line);
    }
  }
  return sections;
}

function updatedLabel(at: number): string {
  const d = new Date(at);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `Updated ${time}` : `Updated ${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
}

export function buildWidgetProps(sessions: Session[]): EavesWidgetProps {
  const latest = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (!latest) return EMPTY_WIDGET_PROPS;

  const sections = parseNotes(latest.notes);
  const actionLines = sections["action items"] ?? [];
  const open = actionLines
    .map((l) => l.match(/^\s*[-*]\s+\[\s\]\s+(.*)$/)?.[1])
    .filter((a): a is string => !!a)
    .map((a) => clip(plain(a), 60));

  const summary = plain((sections["summary"] ?? []).join(" "));
  const fallback = latest.segments.length
    ? `${latest.segments.length} lines transcribed. Notes will appear here.`
    : "No transcript yet.";

  return {
    hasMeeting: true,
    title: clip(latest.title, 60),
    summary: clip(summary || fallback, 220),
    actions: open.slice(0, MAX_ACTIONS),
    openActions: open.length,
    updatedLabel: updatedLabel(latest.updatedAt),
  };
}

let lastSent = "";
let timer: ReturnType<typeof setTimeout> | null = null;

/** Pushes the latest meeting to the home screen widget (skips if nothing changed). */
export function syncWidget(): void {
  try {
    const props = buildWidgetProps(useSessions.getState().sessions);
    const key = JSON.stringify(props);
    if (key === lastSent) return;
    lastSent = key;
    EavesWidget.updateSnapshot(props);
  } catch (e) {
    // Widgets are a nice-to-have; never let them break the app.
    console.warn("[widget] update failed", e);
  }
}

/** Keeps the widget in step with saved meetings. Call once at app start; returns an unsubscribe. */
export function startWidgetSync(): () => void {
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(syncWidget, DEBOUNCE_MS);
  };

  const unsubHydrate = useSessions.persist.onFinishHydration(() => syncWidget());
  if (useSessions.persist.hasHydrated()) syncWidget();
  const unsubStore = useSessions.subscribe((state, prev) => {
    if (state.sessions !== prev.sessions) schedule();
  });

  return () => {
    unsubHydrate();
    unsubStore();
    if (timer) clearTimeout(timer);
  };
}
