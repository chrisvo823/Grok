import { describe, expect, it } from "vitest";
import type { NormalizedPinout } from "@harness/shared";
import {
  DEFAULT_PAGE2_TEMPLATE_ANCHORS,
  buildPage2OverlayModel,
  buildPage2Scene,
  buildPage2TemplateCalibration,
} from "../index";

const samplePinout: NormalizedPinout = {
  rows: [
    {
      fromPin: 1,
      toPin: 2,
      leftLabel: "CAN_TX",
      rightLabel: "CAN_TX",
      awg: "22",
      color: "WHT",
      wireNumber: "W101",
      pair: "TP1",
      type: "TP",
      used: true,
      sourceRow: 2,
    },
    {
      fromPin: 2,
      toPin: 3,
      leftLabel: "CAN_RX",
      rightLabel: "CAN_RX",
      awg: "22",
      color: "BLK",
      wireNumber: "W102",
      pair: "",
      type: "AWG",
      used: true,
      sourceRow: 3,
    },
  ],
  pinCount: 26,
  diagnostics: {
    selectedSheet: "Ladder_26pin",
    ignoredRows: 0,
    warnings: [],
  },
};

describe("buildPage2OverlayModel", () => {
  it("emits deterministic dynamic model without connector rectangles", () => {
    const scene = buildPage2Scene(samplePinout, {
      leftConnectorName: "P2",
      rightConnectorName: "P4",
      leftConnectorSubtitle: "LEFT",
      rightConnectorSubtitle: "RIGHT",
      linePitchMm: 9.5,
      autoExpandConnectorColumns: true,
    });

    const model = buildPage2OverlayModel(scene);
    expect(model.wires).toHaveLength(2);
    expect(model.pinDots.length).toBe(scene.pinRows.length * 2);
    expect(model.figure8Markers.length).toBe(4);
    expect(model.texts.some((text) => text.tone === "meta" && text.value.includes("W101"))).toBe(true);
    expect(model.texts.some((text) => text.tone === "heading" && text.value === "P2")).toBe(true);
    expect("columns" in (model as Record<string, unknown>)).toBe(false);
    expect("rails" in (model as Record<string, unknown>)).toBe(false);
  });
});

describe("buildPage2TemplateCalibration", () => {
  it("computes deterministic anchor calibration structure", () => {
    const scene = buildPage2Scene(samplePinout, {
      leftConnectorName: "P2",
      rightConnectorName: "P4",
      leftConnectorSubtitle: "LEFT",
      rightConnectorSubtitle: "RIGHT",
      linePitchMm: 9.5,
      autoExpandConnectorColumns: true,
    });
    const calibration = buildPage2TemplateCalibration({
      scene,
      templateAnchors: DEFAULT_PAGE2_TEMPLATE_ANCHORS,
      templatePageSizePt: DEFAULT_PAGE2_TEMPLATE_ANCHORS.templatePageSizePt,
      targetViewportSizePx: { width: 1800, height: 1013 },
    });

    expect(calibration.overlayToViewportPx.scaleX).toBeCloseTo(2.5, 4);
    expect(calibration.overlayToViewportPx.offsetX).toBeCloseTo(0, 4);
    expect(calibration.templateAnchors.leftRailX).toBe(215);
    expect(calibration.overlayAnchors.leftRailX).toBe(scene.leftColumn.railX);
  });
});
