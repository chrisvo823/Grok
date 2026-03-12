import { describe, expect, it } from "vitest";
import type { NormalizedPinout } from "@harness/shared";
import { buildPage2Scene } from "../index";

const samplePinout: NormalizedPinout = {
  rows: [
    {
      fromPin: 2,
      toPin: 5,
      leftLabel: "SIG-2",
      rightLabel: "SIG-5",
      awg: "24",
      color: "BLK",
      wireNumber: "W2",
      pair: "",
      type: "AWG",
      used: true,
      sourceRow: 3,
    },
    {
      fromPin: 1,
      toPin: 4,
      leftLabel: "TP-A",
      rightLabel: "TP-B",
      awg: "26",
      color: "WHT",
      wireNumber: "W1",
      pair: "TP1",
      type: "TP",
      used: true,
      sourceRow: 2,
    },
    {
      fromPin: 3,
      toPin: 3,
      leftLabel: "UNUSED",
      rightLabel: "UNUSED",
      awg: "24",
      color: "RED",
      wireNumber: "W3",
      pair: "",
      type: "AWG",
      used: false,
      sourceRow: 4,
    },
  ],
  pinCount: 8,
  sourceName: "fixture",
  diagnostics: {
    selectedSheet: "Ladder_26pin",
    ignoredRows: 0,
    warnings: [],
  },
};

describe("buildPage2Scene", () => {
  it("builds deterministic mapped wire geometry and TP markers", () => {
    const scene = buildPage2Scene(samplePinout, {
      leftConnectorName: "P2",
      rightConnectorName: "P4",
      leftConnectorSubtitle: "LEFT",
      rightConnectorSubtitle: "RIGHT",
      linePitchMm: 9.5,
      autoExpandConnectorColumns: true,
    });

    expect(scene.pinRows.length).toBe(10);
    expect(scene.wires.length).toBe(2);
    expect(scene.wires.map((wire) => [wire.fromPin, wire.toPin])).toEqual([
      [1, 4],
      [2, 5],
    ]);
    expect(scene.wires[0].twistedPair).toBe(true);
    expect(scene.wires[0].leftTpMarkerCenter).toBeDefined();
    expect(scene.wires[0].rightTpMarkerCenter).toBeDefined();
    expect(scene.wires[1].leftTpMarkerCenter).toBeUndefined();
    expect(scene.leftColumn.name).toBe("P2");
    expect(scene.rightColumn.name).toBe("P4");
  });

  it("expands connector columns only when enabled", () => {
    const expanded = buildPage2Scene(
      {
        ...samplePinout,
        pinCount: 26,
      },
      { autoExpandConnectorColumns: true },
    );
    const fixed = buildPage2Scene(
      {
        ...samplePinout,
        pinCount: 26,
      },
      { autoExpandConnectorColumns: false },
    );

    expect(expanded.leftColumn.height).toBeGreaterThanOrEqual(fixed.leftColumn.height);
    expect(fixed.leftColumn.height).toBe(238);
  });
});
