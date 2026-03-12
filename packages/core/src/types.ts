export type PinoutRow = {
  fromPin: number;
  toPin: number;
  leftLabel: string;
  rightLabel: string;
  awg: string;
  color: string;
  pair: string;
  type: "AWG" | "TP";
  used: boolean;
};

export type NormalizedPinout = {
  rows: PinoutRow[];
  pinCount: number;
  sourceName?: string;
};

export type PageSizePt = {
  width: number;
  height: number;
};

export type GeometryPoint = {
  x: number;
  y: number;
};

export type Page2Geometry = {
  pageSize: PageSizePt;
  leftColumnX: number;
  rightColumnX: number;
  leftRailX: number;
  rightRailX: number;
  columnY: number;
  columnWidth: number;
  columnHeight: number;
  pinYs: number[];
};
