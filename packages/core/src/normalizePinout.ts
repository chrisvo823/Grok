import type { NormalizedPinout, PinoutRow } from "./types";

const HEADER_ALIASES: Record<string, string[]> = {
  fromPin: ["frompin", "from_pin", "leftpin", "p2", "p2pin"],
  toPin: ["topin", "to_pin", "rightpin", "p4", "p4pin"],
  signalName: ["signalname", "signal", "name", "leftlabel", "rightlabel"],
  leftLabel: ["leftlabel", "fromsignal", "leftsignal"],
  rightLabel: ["rightlabel", "tosignal", "rightsignal"],
  awg: ["awg", "gauge"],
  color: ["color", "colour", "wirecolor"],
  pair: ["tp", "pair", "twistedpair"],
  used: ["used", "active", "isused"],
};

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[\s\-]+/g, "").replace(/[^a-z0-9_]/g, "");
}

function getValue<T extends Record<string, unknown>>(row: T, aliases: string[]): unknown {
  for (const alias of aliases) {
    const hit = Object.keys(row).find((key) => normalizeHeader(key) === normalizeHeader(alias));
    if (hit) return row[hit];
  }
  return undefined;
}

function normalizeColor(value: unknown): string {
  const raw = String(value ?? "").trim().toUpperCase();
  const map: Record<string, string> = {
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
  return map[raw] ?? raw;
}

export function normalizePinout(rows: Record<string, unknown>[]): NormalizedPinout {
  const normalized: PinoutRow[] = [];
  let maxPin = 0;

  for (const row of rows) {
    const fromPin = Number(getValue(row, HEADER_ALIASES.fromPin));
    const toPin = Number(getValue(row, HEADER_ALIASES.toPin));

    if (!Number.isFinite(fromPin) || !Number.isFinite(toPin)) continue;

    const signalName = String(getValue(row, HEADER_ALIASES.signalName) ?? "").trim();
    const leftLabel = String(getValue(row, HEADER_ALIASES.leftLabel) ?? signalName).trim();
    const rightLabel = String(getValue(row, HEADER_ALIASES.rightLabel) ?? signalName).trim();
    const pair = String(getValue(row, HEADER_ALIASES.pair) ?? "").trim();
    const usedRaw = String(getValue(row, HEADER_ALIASES.used) ?? "").trim().toLowerCase();

    const item: PinoutRow = {
      fromPin,
      toPin,
      leftLabel,
      rightLabel,
      awg: String(getValue(row, HEADER_ALIASES.awg) ?? "").trim(),
      color: normalizeColor(getValue(row, HEADER_ALIASES.color)),
      pair,
      type: pair ? "TP" : "AWG",
      used: usedRaw === "" ? true : !["0", "false", "no", "n"].includes(usedRaw),
    };

    normalized.push(item);
    maxPin = Math.max(maxPin, fromPin, toPin);
  }

  return {
    rows: normalized,
    pinCount: Math.max(maxPin, 10),
  };
}
