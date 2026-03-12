import type { Page1ParsedNote, Page1TemplateAnchorConfig } from "../types";

const NOTE_REGEX = /^\s*(\d{1,2})[\.\)\-:]?\s*(.*)$/;

function normalizeNumber(number: string): string {
  const parsed = Number(number);
  if (!Number.isFinite(parsed)) return number;
  return parsed.toString().padStart(2, "0");
}

export function parseNumberedNotes(source: string): Page1ParsedNote[] {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const notes: Page1ParsedNote[] = [];
  let current: Page1ParsedNote | null = null;

  for (const line of lines) {
    const hit = line.match(NOTE_REGEX);
    if (hit) {
      if (current) notes.push(current);
      current = {
        number: normalizeNumber(hit[1]),
        body: hit[2].trim(),
      };
      continue;
    }

    if (!current) {
      current = { number: "01", body: line.trim() };
    } else {
      current.body = `${current.body} ${line.trim()}`.trim();
    }
  }

  if (current) notes.push(current);
  return notes;
}

export function wrapNoteText(body: string, maxCharsPerLine: number): string[] {
  if (maxCharsPerLine <= 0) return [body];
  const words = body.split(/\s+/).filter(Boolean);
  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) wrapped.push(current);
    current = word;
  }

  if (current) wrapped.push(current);
  return wrapped.length > 0 ? wrapped : [""];
}

export type LaidOutPage1NoteLine = {
  noteNumber: string;
  isFirstLine: boolean;
  text: string;
  x: number;
  y: number;
};

export type LaidOutPage1Note = {
  number: string;
  lines: LaidOutPage1NoteLine[];
};

export function layoutPage1Notes(
  notes: Page1ParsedNote[],
  anchors: Page1TemplateAnchorConfig["notesRegion"],
): LaidOutPage1Note[] {
  const maxCharsPerLine = Math.max(
    8,
    Math.floor((anchors.width - anchors.numberColumnWidth) / anchors.charWidthEstimate),
  );
  const output: LaidOutPage1Note[] = [];
  let lineIndex = 0;

  for (const note of notes) {
    const bodyLines = wrapNoteText(note.body, maxCharsPerLine);
    const lines: LaidOutPage1NoteLine[] = [];

    for (let index = 0; index < bodyLines.length; index += 1) {
      if (lineIndex >= anchors.maxLines) break;
      const y = anchors.y + lineIndex * anchors.lineHeight;
      lines.push({
        noteNumber: note.number,
        isFirstLine: index === 0,
        text: bodyLines[index],
        x: anchors.x + anchors.numberColumnWidth,
        y,
      });
      lineIndex += 1;
    }

    if (lines.length > 0) output.push({ number: note.number, lines });
    if (lineIndex >= anchors.maxLines) break;
  }

  return output;
}
