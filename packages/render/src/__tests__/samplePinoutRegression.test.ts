import { describe, expect, it } from "vitest";
import type { NormalizedPinout, PinoutRow } from "@harness/shared";
import samplePinoutFixture from "../../../../samples/pinout.ladder_26pin.json";
import {
  DEFAULT_PAGE2_TEMPLATE_ANCHORS,
  buildPage2OverlayModel,
  buildPage2Scene,
  buildPage2TemplateCalibration,
} from "../index";

const samplePinout: NormalizedPinout = {
  rows: samplePinoutFixture.rows.map<PinoutRow>((row) => ({
    ...row,
    type: row.type === "TP" ? "TP" : "AWG",
  })),
  pinCount: samplePinoutFixture.pinCount,
  sourceName: "samples/pinout.ladder_26pin.json",
  diagnostics: {
    selectedSheet: "Ladder_26pin",
    ignoredRows: 0,
    warnings: [],
  },
};

describe("sample pinout regression", () => {
  it("keeps crossover mapping and TP markers stable for sample dataset", () => {
    const scene = buildPage2Scene(samplePinout, {
      linePitchMm: 9.5,
      autoExpandConnectorColumns: true,
      leftConnectorName: "P2",
      rightConnectorName: "P4",
      leftConnectorSubtitle: "TO TAIL (J2)",
      rightConnectorSubtitle: "TO I/O CARRIER (J4)",
    });
    const pinY = new Map(scene.pinRows.map((row) => [row.pin, row.y]));
    const crossoverWire = scene.wires.find((wire) => wire.fromPin === 22 && wire.toPin === 10);
    expect(crossoverWire).toBeDefined();
    expect(crossoverWire?.start.y).toBe(pinY.get(22));
    expect(crossoverWire?.end.y).toBe(pinY.get(10));

    const overlay = buildPage2OverlayModel(scene);
    const twistedPairRows = scene.wires.filter((wire) => wire.twistedPair).length;
    expect(overlay.figure8Markers.length).toBe(twistedPairRows * 4);
    expect(overlay.wires.length).toBe(scene.wires.length);
  });

  it("builds deterministic template calibration for sample dataset", () => {
    const scene = buildPage2Scene(samplePinout, {
      linePitchMm: 9.5,
      autoExpandConnectorColumns: true,
    });
    const first = buildPage2TemplateCalibration({
      scene,
      templateAnchors: DEFAULT_PAGE2_TEMPLATE_ANCHORS,
      templatePageSizePt: { width: 720, height: 405 },
      targetViewportSizePx: { width: 1800, height: 1013 },
    });
    const second = buildPage2TemplateCalibration({
      scene,
      templateAnchors: DEFAULT_PAGE2_TEMPLATE_ANCHORS,
      templatePageSizePt: { width: 720, height: 405 },
      targetViewportSizePx: { width: 1800, height: 1013 },
    });
    expect(first).toEqual(second);
  });
});
