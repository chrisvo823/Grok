import type { Page2Geometry } from "./types";

export type BuildPage2GeometryOptions = {
  pinCount: number;
  linePitchMm: number;
  autoExpandConnectorColumns: boolean;
};

const PAGE_W = 720;
const PAGE_H = 405;
const BASE_COLUMN_HEIGHT = 238;
const MIN_MARGIN = 22;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

export function buildPage2Geometry(options: BuildPage2GeometryOptions): Page2Geometry {
  const pinCount = Math.max(10, options.pinCount);
  const innerPins = Math.max(pinCount - 2, 1);
  const pitchPt = mmToPt(clamp(options.linePitchMm, 6, 14));

  let columnHeight = BASE_COLUMN_HEIGHT;
  if (options.autoExpandConnectorColumns) {
    const requiredInnerHeight = innerPins <= 1 ? 0 : (innerPins - 1) * pitchPt;
    const needed = requiredInnerHeight + 2 * MIN_MARGIN;
    columnHeight = Math.max(BASE_COLUMN_HEIGHT, Math.min(needed, 265));
  }

  const usableHeight = columnHeight - 2 * MIN_MARGIN;
  const step = innerPins > 1 ? usableHeight / (innerPins - 1) : 0;
  const pinYs: number[] = [];
  for (let index = 1; index <= pinCount; index += 1) {
    let y = 96 + MIN_MARGIN;
    if (index > 1 && index < pinCount) y += (index - 2) * step;
    else if (index === pinCount) y += usableHeight;
    pinYs.push(y);
  }

  return {
    pageSize: { width: PAGE_W, height: PAGE_H },
    leftColumnX: 178,
    rightColumnX: 492,
    leftRailX: 215,
    rightRailX: 470,
    columnY: 96,
    columnWidth: 36,
    columnHeight,
    pinYs,
  };
}
