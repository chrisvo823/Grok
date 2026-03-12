import type { NormalizedPinout, PinoutRow } from "../types";
import { PINOUT_COLUMN_ALIASES, type PinoutColumnName, buildColumnLookup, canonicalizeHeader } from "./headerAliases";
import { PinoutParseError } from "./errors";

type WorksheetRow = Record<string, unknown>;

const TRUE_VALUES = new Set(["1", "true", "yes", "y", "x"]);
const FALSE_VALUES = new Set(["0", "false", "no", "n"]);

const COLOR_ABBREVIATIONS: Record<string, string> = {
  WHITE: "WHT",
  BLACK: "BLK",
  BLUE: "BLU",
  GREEN: "GRN",
  YELLOW: "YEL",
  ORANGE: "ORG",
  BROWN: "BRN",
  VIOLET: "VIO",
  PURPLE: "PUR",
  RED: "RED",
  GRAY: "GRY",
  GREY: "GRY",
};

const MIN_PIN_COUNT = 10;

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeColor(value: unknown): string {
  const raw = normalizeCellValue(value).toUpperCase();
  if (!raw) return "";
  return COLOR_ABBREVIATIONS[raw] ?? raw;
}

function parsePin(value: unknown): number | null {
  const raw = normalizeCellValue(value);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function resolveColumn(columnLookup: Map<string, string>, columnName: PinoutColumnName): string | null {
  const aliases = PINOUT_COLUMN_ALIASES[columnName];
  for (const alias of aliases) {
    const hit = columnLookup.get(canonicalizeHeader(alias));
    if (hit) return hit;
  }
  return null;
}

function parseUsedFlag(value: unknown): boolean {
  const raw = normalizeCellValue(value).toLowerCase();
  if (!raw) return true;
  if (TRUE_VALUES.has(raw)) return true;
  if (FALSE_VALUES.has(raw)) return false;
  return true;
}

function isTwistedPair(typeValue: unknown, pairValue: unknown): boolean {
  const normalizedType = normalizeCellValue(typeValue).toUpperCase();
  return normalizedType.includes("TP") || normalizeCellValue(pairValue).length > 0;
}

export function scoreHeaderCoverage(headers: string[]): number {
  const lookup = buildColumnLookup(headers);
  let score = 0;
  for (const name of ["fromPin", "toPin", "signalName", "leftLabel", "rightLabel", "awg", "color", "pair"] as const) {
    if (resolveColumn(lookup, name)) score += 1;
  }
  return score;
}

export function normalizePinoutRows(
  rows: WorksheetRow[],
  selectedSheet: string,
  sourceName?: string,
): NormalizedPinout {
  const headerNames = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) headerNames.add(key);
  }

  const headers = [...headerNames];
  const columnLookup = buildColumnLookup(headers);
  const fromKey = resolveColumn(columnLookup, "fromPin");
  const toKey = resolveColumn(columnLookup, "toPin");

  if (!fromKey || !toKey) {
    throw new PinoutParseError(
      "MISSING_REQUIRED_COLUMNS",
      "Pinout must contain recognizable from-pin and to-pin columns.",
    );
  }

  const signalNameKey = resolveColumn(columnLookup, "signalName");
  const leftLabelKey = resolveColumn(columnLookup, "leftLabel");
  const rightLabelKey = resolveColumn(columnLookup, "rightLabel");
  const awgKey = resolveColumn(columnLookup, "awg");
  const colorKey = resolveColumn(columnLookup, "color");
  const wireNumberKey = resolveColumn(columnLookup, "wireNumber");
  const pairKey = resolveColumn(columnLookup, "pair");
  const typeKey = resolveColumn(columnLookup, "type");
  const usedKey = resolveColumn(columnLookup, "used");

  const normalizedRows: PinoutRow[] = [];
  let ignoredRows = 0;
  let maxPin = 0;

  rows.forEach((row, index) => {
    const fromPin = parsePin(row[fromKey]);
    const toPin = parsePin(row[toKey]);
    if (!fromPin || !toPin) {
      ignoredRows += 1;
      return;
    }

    const signalName = signalNameKey ? normalizeCellValue(row[signalNameKey]) : "";
    const leftLabel = leftLabelKey ? normalizeCellValue(row[leftLabelKey]) : signalName;
    const rightLabel = rightLabelKey ? normalizeCellValue(row[rightLabelKey]) : signalName;
    const pair = pairKey ? normalizeCellValue(row[pairKey]) : "";
    const wireType = isTwistedPair(typeKey ? row[typeKey] : "", pair) ? "TP" : "AWG";

    normalizedRows.push({
      fromPin,
      toPin,
      signalName,
      leftLabel,
      rightLabel,
      awg: awgKey ? normalizeCellValue(row[awgKey]) : "",
      color: colorKey ? normalizeColor(row[colorKey]) : "",
      wireNumber: wireNumberKey ? normalizeCellValue(row[wireNumberKey]) : "",
      pair,
      type: wireType,
      used: parseUsedFlag(usedKey ? row[usedKey] : undefined),
      sourceRow: index + 2,
    });

    maxPin = Math.max(maxPin, fromPin, toPin);
  });

  if (normalizedRows.length === 0) {
    throw new PinoutParseError("NO_USABLE_ROWS", "Pinout has no usable pin mappings after normalization.");
  }

  normalizedRows.sort((a, b) => {
    if (a.fromPin !== b.fromPin) return a.fromPin - b.fromPin;
    if (a.toPin !== b.toPin) return a.toPin - b.toPin;
    return (a.sourceRow ?? 0) - (b.sourceRow ?? 0);
  });

  const warnings: string[] = [];
  if (ignoredRows > 0) {
    warnings.push(`${ignoredRows} row(s) were ignored because fromPin/toPin were missing or invalid.`);
  }
  if (!leftLabelKey || !rightLabelKey) {
    warnings.push("Signal labels defaulted from a shared signal-name column where dedicated side labels were not present.");
  }

  return {
    rows: normalizedRows,
    pinCount: Math.max(maxPin, MIN_PIN_COUNT),
    sourceName,
    diagnostics: {
      selectedSheet,
      ignoredRows,
      warnings,
    },
  };
}
