import { scoreHeaderCoverage } from "./normalizePinoutRows";
import { PinoutParseError } from "./errors";

type WorksheetRows = Record<string, unknown>[];

export type WorkbookSheetCandidate = {
  sheetName: string;
  rows: WorksheetRows;
};

const PREFERRED_SHEET = "ladder_26pin";

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function scoreSheet(candidate: WorkbookSheetCandidate): number {
  if (candidate.rows.length === 0) return 0;
  const headers = new Set<string>();
  for (const row of candidate.rows.slice(0, 20)) {
    for (const key of Object.keys(row)) headers.add(key);
  }

  const headerScore = scoreHeaderCoverage([...headers]);
  const rowScore = Math.min(candidate.rows.length, 100) / 100;
  return headerScore + rowScore;
}

export function selectBestWorkbookSheet(candidates: WorkbookSheetCandidate[]): WorkbookSheetCandidate {
  if (candidates.length === 0) {
    throw new PinoutParseError("WORKBOOK_NO_SHEETS", "Workbook has no visible worksheets.");
  }

  const preferred = candidates.find((candidate) => normalizeName(candidate.sheetName) === PREFERRED_SHEET);
  if (preferred) return preferred;

  let best = candidates[0];
  let bestScore = scoreSheet(best);
  for (const candidate of candidates.slice(1)) {
    const candidateScore = scoreSheet(candidate);
    if (candidateScore > bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  }
  return best;
}
