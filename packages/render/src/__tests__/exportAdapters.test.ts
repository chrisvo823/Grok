import { describe, expect, it } from "vitest";
import {
  buildPage2ExportPrimitives,
  exportDxfDocument,
  exportSvgDocument,
  type Page2OverlayModel,
} from "../index";

const page2Overlay: Page2OverlayModel = {
  sceneWidth: 720,
  sceneHeight: 405,
  pinDots: [{ x: 215, y: 120 }],
  pinLabels: [{ id: "pin-1", value: "1", x: 210, y: 122, textAnchor: "end" }],
  wires: [{ id: "wire-1", x1: 215, y1: 120, x2: 493, y2: 140 }],
  texts: [{ id: "heading-left", value: "P2", x: 196, y: 70, textAnchor: "middle", tone: "heading" }],
  figure8Markers: [
    { id: "tp-top", x: 223, y: 118, radius: 1.5 },
    { id: "tp-bottom", x: 223, y: 122, radius: 1.5 },
  ],
};

describe("render export adapters", () => {
  it("builds deterministic page2 export primitives without connector rectangles", () => {
    const primitives = buildPage2ExportPrimitives(page2Overlay, {
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
    });
    expect(primitives.some((primitive) => primitive.kind === "line")).toBe(true);
    expect(primitives.some((primitive) => primitive.kind === "circle")).toBe(true);
    expect(primitives.some((primitive) => primitive.kind === "text")).toBe(true);
    expect(primitives.some((primitive) => primitive.kind === "polygon")).toBe(false);
  });

  it("serializes SVG and DXF with expected entities", () => {
    const primitives = buildPage2ExportPrimitives(page2Overlay, {
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
    });
    const svg = exportSvgDocument({
      width: 720,
      height: 405,
      primitives,
      backgroundImageDataUrl: "data:image/png;base64,AAA",
    });
    const dxf = exportDxfDocument({
      pageHeight: 405,
      primitives,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("<line");
    expect(svg).toContain("<circle");
    expect(svg).toContain("data:image/png");
    expect(svg).not.toContain("<rect");
    expect(dxf).toContain("SECTION");
    expect(dxf).toContain("LINE");
    expect(dxf).toContain("CIRCLE");
    expect(dxf).toContain("TEXT");
  });
});
