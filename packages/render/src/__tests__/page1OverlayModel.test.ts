import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE1_TEMPLATE_ANCHORS,
  buildPage1OverlayModel,
  buildPage1TemplateCalibration,
  layoutPage1Notes,
  parseNumberedNotes,
} from "../index";
import type { Page1OverlayFields } from "../types";

const sampleFields: Page1OverlayFields = {
  overallLength: "130 MM",
  labelA: "A",
  labelB: "B",
  notesText: [
    "01 FIRST NOTE TEXT FOR ASSEMBLY.",
    "02 SECOND NOTE TEXT WRAPS.",
    "05 TRIANGLE MARKER NOTE.",
    "07 SQUARE MARKER NOTE.",
  ].join("\n"),
  revision: {
    rev: "A01",
    desc: "INITIAL RELEASE",
    date: "16-FEB-26",
    by: "KATIE C.",
  },
  titleBlock: {
    title: "HARNESS",
    number: "D-1001",
    revision: "A",
    sheet: "1 / 2",
    date: "2026-02-16",
    file: "harness.asm",
  },
  callouts: [
    { id: "callout_1", value: "01" },
    { id: "callout_2", value: "02" },
    { id: "callout_3", value: "03" },
    { id: "callout_4", value: "04" },
    { id: "callout_5", value: "05" },
  ],
};

describe("page1 notes helpers", () => {
  it("parses numbered notes and preserves numbering", () => {
    const notes = parseNumberedNotes(sampleFields.notesText);
    expect(notes).toHaveLength(4);
    expect(notes[0].number).toBe("01");
    expect(notes[2].number).toBe("05");
    expect(notes[3].number).toBe("07");
  });

  it("lays out notes deterministically within anchor region", () => {
    const parsed = parseNumberedNotes(sampleFields.notesText);
    const laidOut = layoutPage1Notes(parsed, DEFAULT_PAGE1_TEMPLATE_ANCHORS.notesRegion);
    expect(laidOut.length).toBeGreaterThan(0);
    expect(laidOut[0].lines[0].x).toBe(DEFAULT_PAGE1_TEMPLATE_ANCHORS.notesRegion.x + DEFAULT_PAGE1_TEMPLATE_ANCHORS.notesRegion.numberColumnWidth);
    expect(laidOut[0].lines[0].y).toBe(DEFAULT_PAGE1_TEMPLATE_ANCHORS.notesRegion.y);
  });
});

describe("buildPage1OverlayModel", () => {
  it("builds deterministic overlay model with required note markers", () => {
    const model = buildPage1OverlayModel(sampleFields, DEFAULT_PAGE1_TEMPLATE_ANCHORS);
    expect(model.sceneWidth).toBe(720);
    expect(model.sceneHeight).toBe(405);
    expect(model.callouts).toHaveLength(DEFAULT_PAGE1_TEMPLATE_ANCHORS.calloutAnchors.length);
    expect(model.markers.some((marker) => marker.type === "triangle")).toBe(true);
    expect(model.markers.some((marker) => marker.type === "square")).toBe(true);
    expect(model.texts.some((text) => text.id === "overall-length" && text.value === "130 MM")).toBe(true);
  });
});

describe("buildPage1TemplateCalibration", () => {
  it("returns deterministic viewport scaling for template page", () => {
    const calibration = buildPage1TemplateCalibration({
      templateAnchors: DEFAULT_PAGE1_TEMPLATE_ANCHORS,
      templatePageSizePt: { width: 720, height: 405 },
      targetViewportSizePx: { width: 1800, height: 1012.5 },
    });
    expect(calibration.overlayToViewportPx.scaleX).toBeCloseTo(2.5, 5);
    expect(calibration.overlayToViewportPx.scaleY).toBeCloseTo(2.5, 5);
    expect(calibration.overlayToViewportPx.offsetX).toBe(0);
    expect(calibration.overlayToViewportPx.offsetY).toBe(0);
  });
});
