import type {
  Page1OverlayMarker,
  Page1OverlayModel,
  Page2OverlayModel,
  Page2OverlayTransform,
  ScenePoint,
} from "../types";

// These primitives are the shared contract between preview-calibrated geometry
// and concrete exporters (PDF/SVG/DXF today, native LdrDoc later).
export type ExportLayer = "HARNESS_WIRES" | "HARNESS_DOTS" | "HARNESS_TEXT" | "HARNESS_MARKERS";

export type ExportLinePrimitive = {
  kind: "line";
  layer: ExportLayer;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
};

export type ExportCirclePrimitive = {
  kind: "circle";
  layer: ExportLayer;
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
};

export type ExportTextPrimitive = {
  kind: "text";
  layer: ExportLayer;
  x: number;
  y: number;
  text: string;
  size: number;
  anchor?: "start" | "middle" | "end";
  fill: string;
};

export type ExportPolygonPrimitive = {
  kind: "polygon";
  layer: ExportLayer;
  points: ScenePoint[];
  stroke: string;
  strokeWidth: number;
  fill?: string;
};

export type ExportPrimitive =
  | ExportLinePrimitive
  | ExportCirclePrimitive
  | ExportTextPrimitive
  | ExportPolygonPrimitive;

function transformPoint(point: ScenePoint, transform: Page2OverlayTransform): ScenePoint {
  return {
    x: point.x * transform.scaleX + transform.offsetX,
    y: point.y * transform.scaleY + transform.offsetY,
  };
}

function transformMarker(marker: Page1OverlayMarker, transform: Page2OverlayTransform): Page1OverlayMarker {
  const point = transformPoint({ x: marker.x, y: marker.y }, transform);
  return {
    ...marker,
    x: point.x,
    y: point.y,
    size: marker.size * Math.max(transform.scaleX, transform.scaleY),
  };
}

function textSizeForTone(tone: string): number {
  if (tone === "heading") return 9;
  if (tone === "subheading") return 6;
  if (tone === "meta") return 4.6;
  if (tone === "callout") return 6;
  if (tone === "fieldLabel") return 5.2;
  if (tone === "fieldValue") return 5.5;
  if (tone === "notes") return 5;
  return 5;
}

function textColorForTone(tone: string): string {
  if (tone === "heading" || tone === "subheading") return "#1b2e9e";
  if (tone === "meta") return "#1b2e9e";
  return "#111111";
}

function trianglePoints(marker: Page1OverlayMarker): ScenePoint[] {
  return [
    { x: marker.x, y: marker.y - marker.size },
    { x: marker.x - marker.size * 0.9, y: marker.y + marker.size * 0.7 },
    { x: marker.x + marker.size * 0.9, y: marker.y + marker.size * 0.7 },
  ];
}

export function buildPage1ExportPrimitives(
  model: Page1OverlayModel,
  transform: Page2OverlayTransform,
): ExportPrimitive[] {
  const primitives: ExportPrimitive[] = [];

  for (const callout of model.callouts) {
    const center = transformPoint({ x: callout.x, y: callout.y }, transform);
    primitives.push({
      kind: "circle",
      layer: "HARNESS_MARKERS",
      cx: center.x,
      cy: center.y,
      r: callout.radius * Math.max(transform.scaleX, transform.scaleY),
      stroke: "#6e6f73",
      strokeWidth: 0.8,
    });
  }

  for (const marker of model.markers) {
    const transformed = transformMarker(marker, transform);
    if (transformed.type === "triangle") {
      primitives.push({
        kind: "polygon",
        layer: "HARNESS_MARKERS",
        points: trianglePoints(transformed),
        stroke: "#2f58d8",
        strokeWidth: 0.9,
      });
    } else {
      primitives.push({
        kind: "polygon",
        layer: "HARNESS_MARKERS",
        points: [
          { x: transformed.x - transformed.size, y: transformed.y - transformed.size },
          { x: transformed.x + transformed.size, y: transformed.y - transformed.size },
          { x: transformed.x + transformed.size, y: transformed.y + transformed.size },
          { x: transformed.x - transformed.size, y: transformed.y + transformed.size },
        ],
        stroke: "#2f58d8",
        strokeWidth: 0.9,
      });
    }
  }

  for (const text of model.texts) {
    const point = transformPoint({ x: text.x, y: text.y }, transform);
    primitives.push({
      kind: "text",
      layer: "HARNESS_TEXT",
      x: point.x,
      y: point.y,
      text: text.value,
      size: textSizeForTone(text.tone),
      anchor: text.textAnchor,
      fill: textColorForTone(text.tone),
    });
  }

  return primitives;
}

export function buildPage2ExportPrimitives(
  model: Page2OverlayModel,
  transform: Page2OverlayTransform,
): ExportPrimitive[] {
  const primitives: ExportPrimitive[] = [];

  for (const wire of model.wires) {
    const p1 = transformPoint({ x: wire.x1, y: wire.y1 }, transform);
    const p2 = transformPoint({ x: wire.x2, y: wire.y2 }, transform);
    primitives.push({
      kind: "line",
      layer: "HARNESS_WIRES",
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      stroke: "#111111",
      strokeWidth: 0.8,
    });
  }

  for (const dot of model.pinDots) {
    const center = transformPoint(dot, transform);
    primitives.push({
      kind: "circle",
      layer: "HARNESS_DOTS",
      cx: center.x,
      cy: center.y,
      r: 1.4 * Math.max(transform.scaleX, transform.scaleY),
      stroke: "#111111",
      strokeWidth: 0.7,
      fill: "#111111",
    });
  }

  for (const marker of model.figure8Markers) {
    const center = transformPoint({ x: marker.x, y: marker.y }, transform);
    primitives.push({
      kind: "circle",
      layer: "HARNESS_MARKERS",
      cx: center.x,
      cy: center.y,
      r: marker.radius * Math.max(transform.scaleX, transform.scaleY),
      stroke: "#111111",
      strokeWidth: 0.7,
    });
  }

  for (const pin of model.pinLabels) {
    const point = transformPoint({ x: pin.x, y: pin.y }, transform);
    primitives.push({
      kind: "text",
      layer: "HARNESS_TEXT",
      x: point.x,
      y: point.y,
      text: pin.value,
      size: 5.2,
      anchor: pin.textAnchor,
      fill: "#1b2e9e",
    });
  }

  for (const text of model.texts) {
    const point = transformPoint({ x: text.x, y: text.y }, transform);
    primitives.push({
      kind: "text",
      layer: "HARNESS_TEXT",
      x: point.x,
      y: point.y,
      text: text.value,
      size: textSizeForTone(text.tone),
      anchor: text.textAnchor,
      fill: textColorForTone(text.tone),
    });
  }

  return primitives;
}
