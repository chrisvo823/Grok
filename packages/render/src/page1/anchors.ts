import type { Page1TemplateAnchorConfig } from "../types";

export const DEFAULT_PAGE1_TEMPLATE_ANCHORS: Page1TemplateAnchorConfig = {
  templatePageSizePt: {
    width: 720,
    height: 405,
  },
  overallLengthAnchor: { x: 347, y: 211 },
  labelAAnchor: { x: 302, y: 244 },
  labelBAnchor: { x: 375, y: 244 },
  notesRegion: {
    x: 40,
    y: 39,
    width: 242,
    lineHeight: 9.5,
    maxLines: 22,
    numberColumnWidth: 24,
    markerOffsetX: 12,
    markerOffsetY: -3.5,
    markerSize: 4.5,
    charWidthEstimate: 4.1,
  },
  revisionRegion: {
    x: 602,
    y: 20,
    rowGap: 8.2,
    valueOffsetX: 18,
  },
  titleBlockRegion: {
    x: 585,
    y: 365,
    rowGap: 7.5,
    valueOffsetX: 24,
  },
  calloutAnchors: [
    { id: "callout_1", x: 286, y: 184, radius: 9 },
    { id: "callout_2", x: 338, y: 175, radius: 9 },
    { id: "callout_3", x: 390, y: 184, radius: 9 },
    { id: "callout_4", x: 431, y: 176, radius: 9 },
    { id: "callout_5", x: 459, y: 184, radius: 9 },
  ],
  calloutTextOffsetY: 1.2,
};

// A named sample profile keeps calibration tuning explicit for future templates.
export const SAMPLE_LADDER_26PIN_PAGE1_TEMPLATE_ANCHORS: Page1TemplateAnchorConfig = {
  ...DEFAULT_PAGE1_TEMPLATE_ANCHORS,
};
