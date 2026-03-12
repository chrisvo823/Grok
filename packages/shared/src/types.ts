export type PinoutType = "AWG" | "TP";

export type PinoutRow = {
  fromPin: number;
  toPin: number;
  signalName?: string;
  leftLabel: string;
  rightLabel: string;
  awg: string;
  color: string;
  wireNumber?: string;
  pair: string;
  type: PinoutType;
  used: boolean;
  sourceRow?: number;
};

export type PinoutParseDiagnostics = {
  selectedSheet: string;
  ignoredRows: number;
  warnings: string[];
};

export type NormalizedPinout = {
  rows: PinoutRow[];
  pinCount: number;
  sourceName?: string;
  diagnostics: PinoutParseDiagnostics;
};

export type PinoutFileKind = "xlsx" | "xls" | "csv";

export type ParsePinoutFileInput = {
  fileName: string;
  data: ArrayBuffer | string;
  sourceName?: string;
};

export type ParsePinoutUploadInput = {
  name: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
};
