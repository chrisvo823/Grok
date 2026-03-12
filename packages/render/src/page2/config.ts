import type { Page2LayoutOptions, PageSizePt } from "../types";

export const PAGE2_BASE_GEOMETRY = {
  pageWidthPt: 720,
  pageHeightPt: 405,
  leftColumnX: 178,
  rightColumnX: 492,
  columnY: 96,
  columnWidth: 36,
  baseColumnHeight: 238,
  maxColumnHeight: 265,
  columnInnerMargin: 22,
  leftRailX: 215,
  rightRailX: 493,
  minPinCount: 10,
  minLinePitchMm: 6,
  maxLinePitchMm: 14,
  headingY: 70,
  subtitleY: 78,
  toolingY: 357,
  leftToolingX: 113,
  rightToolingX: 525,
  labelNudgeY: 2,
  leftLabelX: 182,
  rightLabelX: 524,
  tpMarkerOffsetX: 8,
  tpMarkerOffsetY: 2,
} as const;

export const DEFAULT_PAGE_SIZE_PT: PageSizePt = {
  width: PAGE2_BASE_GEOMETRY.pageWidthPt,
  height: PAGE2_BASE_GEOMETRY.pageHeightPt,
};

export const DEFAULT_PAGE2_LAYOUT: Page2LayoutOptions = {
  linePitchMm: 9.5,
  autoExpandConnectorColumns: true,
  leftConnectorName: "P2",
  rightConnectorName: "P4",
  leftConnectorSubtitle: "",
  rightConnectorSubtitle: "",
};
