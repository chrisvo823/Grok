export const PINOUT_COLUMN_ALIASES = {
  fromPin: [
    "from pin",
    "from_pin",
    "frompin",
    "left pin",
    "left_pin",
    "leftpin",
    "p2",
    "p2 pin",
    "p2_pin",
  ],
  toPin: [
    "to pin",
    "to_pin",
    "topin",
    "right pin",
    "right_pin",
    "rightpin",
    "p4",
    "p4 pin",
    "p4_pin",
  ],
  signalName: ["signal name", "signal_name", "signal", "name", "net name", "net_name"],
  leftLabel: ["left label", "left_label", "left signal", "left_signal", "from signal", "from_signal"],
  rightLabel: ["right label", "right_label", "right signal", "right_signal", "to signal", "to_signal"],
  awg: ["awg", "gauge", "wire gauge", "wire_gauge"],
  color: ["color", "colour", "wire color", "wire_color", "wire colour", "wire_colour"],
  wireNumber: [
    "wire number",
    "wire_number",
    "wire no",
    "wire_no",
    "wire #",
    "wire#",
    "wire",
  ],
  pair: ["tp", "twisted pair", "twisted_pair", "pair", "tp group", "tp_group"],
  type: ["type", "wire type", "wire_type"],
  used: ["used", "is used", "is_used", "active", "enabled", "include"],
} as const;

export type PinoutColumnName = keyof typeof PINOUT_COLUMN_ALIASES;

export function canonicalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[\s\-]+/g, "").replace(/[^a-z0-9]/g, "");
}

export function buildColumnLookup(headers: string[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const header of headers) {
    lookup.set(canonicalizeHeader(header), header);
  }
  return lookup;
}
