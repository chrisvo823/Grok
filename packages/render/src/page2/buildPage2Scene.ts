import type { NormalizedPinout } from "@harness/shared";
import { DEFAULT_PAGE2_LAYOUT, PAGE2_BASE_GEOMETRY } from "./config";
import type { Page2LayoutOptions, Page2PinScene, Page2Scene } from "../types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

function resolveColumnHeight(pinCount: number, options: Page2LayoutOptions): number {
  const base = PAGE2_BASE_GEOMETRY.baseColumnHeight;
  if (!options.autoExpandConnectorColumns) return base;

  const pitchPt = mmToPt(clamp(options.linePitchMm, PAGE2_BASE_GEOMETRY.minLinePitchMm, PAGE2_BASE_GEOMETRY.maxLinePitchMm));
  const innerPins = Math.max(pinCount - 2, 1);
  const requiredInnerHeight = innerPins <= 1 ? 0 : (innerPins - 1) * pitchPt;
  const needed = requiredInnerHeight + PAGE2_BASE_GEOMETRY.columnInnerMargin * 2;
  return Math.max(base, Math.min(needed, PAGE2_BASE_GEOMETRY.maxColumnHeight));
}

function buildPinRows(pinCount: number, columnHeight: number): Page2PinScene[] {
  const pins: Page2PinScene[] = [];
  const innerPins = Math.max(pinCount - 2, 1);
  const usableHeight = columnHeight - PAGE2_BASE_GEOMETRY.columnInnerMargin * 2;
  const step = innerPins > 1 ? usableHeight / (innerPins - 1) : 0;

  for (let pin = 1; pin <= pinCount; pin += 1) {
    let y = PAGE2_BASE_GEOMETRY.columnY + PAGE2_BASE_GEOMETRY.columnInnerMargin;
    if (pin > 1 && pin < pinCount) y += (pin - 2) * step;
    else if (pin === pinCount) y += usableHeight;

    pins.push({
      pin,
      y,
      leftDot: { x: PAGE2_BASE_GEOMETRY.leftRailX, y },
      rightDot: { x: PAGE2_BASE_GEOMETRY.rightRailX, y },
    });
  }
  return pins;
}

function normalizeLayoutOptions(overrides?: Partial<Page2LayoutOptions>): Page2LayoutOptions {
  return {
    ...DEFAULT_PAGE2_LAYOUT,
    ...overrides,
  };
}

export function buildPage2Scene(pinout: NormalizedPinout, overrides?: Partial<Page2LayoutOptions>): Page2Scene {
  const options = normalizeLayoutOptions(overrides);
  const pinCount = Math.max(PAGE2_BASE_GEOMETRY.minPinCount, pinout.pinCount);
  const columnHeight = resolveColumnHeight(pinCount, options);
  const pinRows = buildPinRows(pinCount, columnHeight);
  const pinYByNumber = new Map(pinRows.map((row) => [row.pin, row.y]));

  const rows = pinout.rows
    .filter((row) => row.used)
    .slice()
    .sort((a, b) => {
      if (a.fromPin !== b.fromPin) return a.fromPin - b.fromPin;
      if (a.toPin !== b.toPin) return a.toPin - b.toPin;
      return (a.sourceRow ?? 0) - (b.sourceRow ?? 0);
    });

  const wires = rows
    .filter((row) => pinYByNumber.has(row.fromPin) && pinYByNumber.has(row.toPin))
    .map((row, index) => {
      const startY = pinYByNumber.get(row.fromPin)!;
      const endY = pinYByNumber.get(row.toPin)!;
      const twistedPair = row.type === "TP" || row.pair.length > 0;
      return {
        id: `${row.fromPin}-${row.toPin}-${index}`,
        fromPin: row.fromPin,
        toPin: row.toPin,
        leftLabel: row.leftLabel,
        rightLabel: row.rightLabel,
        source: row,
        start: { x: PAGE2_BASE_GEOMETRY.leftRailX, y: startY },
        end: { x: PAGE2_BASE_GEOMETRY.rightRailX, y: endY },
        leftLabelPos: { x: PAGE2_BASE_GEOMETRY.leftLabelX, y: startY + PAGE2_BASE_GEOMETRY.labelNudgeY },
        rightLabelPos: { x: PAGE2_BASE_GEOMETRY.rightLabelX, y: endY + PAGE2_BASE_GEOMETRY.labelNudgeY },
        twistedPair,
        leftTpMarkerCenter: twistedPair
          ? {
              x: PAGE2_BASE_GEOMETRY.leftRailX + PAGE2_BASE_GEOMETRY.tpMarkerOffsetX,
              y: startY,
            }
          : undefined,
        rightTpMarkerCenter: twistedPair
          ? {
              x: PAGE2_BASE_GEOMETRY.rightRailX - PAGE2_BASE_GEOMETRY.tpMarkerOffsetX,
              y: endY,
            }
          : undefined,
      };
    });

  return {
    pageSize: {
      width: PAGE2_BASE_GEOMETRY.pageWidthPt,
      height: PAGE2_BASE_GEOMETRY.pageHeightPt,
    },
    leftColumn: {
      x: PAGE2_BASE_GEOMETRY.leftColumnX,
      y: PAGE2_BASE_GEOMETRY.columnY,
      width: PAGE2_BASE_GEOMETRY.columnWidth,
      height: columnHeight,
      railX: PAGE2_BASE_GEOMETRY.leftRailX,
      name: options.leftConnectorName,
      subtitle: options.leftConnectorSubtitle,
    },
    rightColumn: {
      x: PAGE2_BASE_GEOMETRY.rightColumnX,
      y: PAGE2_BASE_GEOMETRY.columnY,
      width: PAGE2_BASE_GEOMETRY.columnWidth,
      height: columnHeight,
      railX: PAGE2_BASE_GEOMETRY.rightRailX,
      name: options.rightConnectorName,
      subtitle: options.rightConnectorSubtitle,
    },
    leftToolingAnchor: { x: PAGE2_BASE_GEOMETRY.leftToolingX, y: PAGE2_BASE_GEOMETRY.toolingY },
    rightToolingAnchor: { x: PAGE2_BASE_GEOMETRY.rightToolingX, y: PAGE2_BASE_GEOMETRY.toolingY },
    pinRows,
    wires,
  };
}
