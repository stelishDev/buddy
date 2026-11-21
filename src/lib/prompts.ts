import type { Segment } from "@/store/sessions";

/** Transcript as "[mm:ss] text" lines, keeping the most recent `maxChars`. */
export function formatTranscript(segments: Segment[], startedAt: number, maxChars = 24000): string {
  const lines: string[] = [];
  let total = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const s = segments[i];
    const secs = Math.max(0, Math.round((s.at - startedAt) / 1000));
    const stamp = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
    const line = `[${stamp}] ${s.text}`;
    if (total + line.length > maxChars) {
      lines.unshift("[…earlier transcript truncated…]");
      break;
    }
    lines.unshift(line);
    total += line.length + 1;
  }
  return lines.join("\n");
}

export function assistantSystem(transcript: string, notes: string): string {
  return `You are Eaves, a discreet real-time assistant helping the user during a live meeting.
The user may glance at your answer mid-conversation, so:
- Lead with the answer. No preamble, no restating the question.
- Keep it short: a sentence or a few tight bullet points unless asked for more.
- Ground answers in the meeting transcript when relevant; quote who/when briefly if useful.
- If the transcript doesn't cover it, say so in a few words, then answer from general knowledge and flag that.
- The transcript comes from speech recognition and may contain mis-heard words; infer sensibly.
- When asked what to say, give wording the user can say out loud.

CURRENT MEETING NOTES:
${notes.trim() || "(none yet)"}

LIVE TRANSCRIPT (most recent last):
${transcript.trim() || "(nothing transcribed yet)"}`;
}

export const NOTES_SYSTEM = `You maintain concise running notes for a live meeting.
Return ONLY the full updated notes, using exactly these sections (omit a section if empty):

## Summary
2–4 sentences on what the meeting is about and where it has got to.

## Key points
- bullet points

## Decisions
- bullet points

## Action items
- [ ] Owner — task (due date if mentioned)

## Open questions
- bullet points

Rules: merge new information into the existing notes, never duplicate, keep under ~400 words,
correct obvious speech-recognition errors, and don't invent facts.`;

export function notesUserPrompt(existingNotes: string, newTranscript: string): string {
  return `EXISTING NOTES:
${existingNotes.trim() || "(none yet)"}

NEW TRANSCRIPT SINCE LAST UPDATE:
${newTranscript.trim()}

Return the full updated notes.`;
}

export function autoAnswerPrompt(question: string): string {
  return `Someone in the meeting just asked: "${question}"
Give the user a short, helpful answer or talking points they could use right now. If it's rhetorical or not worth answering, reply with one short line saying so.`;
}

const QUESTION_START =
  /^(what|why|how|when|where|who|whom|whose|which|can|could|should|would|will|do|does|did|is|are|was|were|have|has|any|anyone|shall)\b/i;

/** Heuristic for spotting a question in a speech-recognised sentence (punctuation is often missing). */
export function isLikelyQuestion(text: string): boolean {
  const t = text.trim();
  if (t.split(/\s+/).length < 4) return false;
  if (t.endsWith("?")) return true;
  return QUESTION_START.test(t);
}
