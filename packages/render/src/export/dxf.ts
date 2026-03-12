import type { ExportPrimitive } from "./primitives";

type ExportDxfInput = {
  pageHeight: number;
  primitives: ExportPrimitive[];
  documentName?: string;
};

function formatNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function toDxfY(pageHeight: number, yTop: number): number {
  return pageHeight - yTop;
}

function pushTextEntity(lines: string[], primitive: Extract<ExportPrimitive, { kind: "text" }>, pageHeight: number): void {
  lines.push(
    "0",
    "TEXT",
    "8",
    primitive.layer,
    "10",
    formatNumber(primitive.x),
    "20",
    formatNumber(toDxfY(pageHeight, primitive.y)),
    "30",
    "0",
    "40",
    formatNumber(Math.max(primitive.size, 1)),
    "1",
    primitive.text,
  );
}

export function exportDxfDocument(input: ExportDxfInput): string {
  const lines: string[] = [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$ACADVER",
    "1",
    "AC1027",
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "TABLES",
    "0",
    "TABLE",
    "2",
    "LAYER",
    "70",
    "4",
  ];

  const layers = ["HARNESS_WIRES", "HARNESS_DOTS", "HARNESS_TEXT", "HARNESS_MARKERS"];
  for (const layer of layers) {
    lines.push(
      "0",
      "LAYER",
      "2",
      layer,
      "70",
      "0",
      "62",
      "7",
      "6",
      "CONTINUOUS",
    );
  }

  lines.push(
    "0",
    "ENDTAB",
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "ENTITIES",
  );

  for (const primitive of input.primitives) {
    if (primitive.kind === "line") {
      lines.push(
        "0",
        "LINE",
        "8",
        primitive.layer,
        "10",
        formatNumber(primitive.x1),
        "20",
        formatNumber(toDxfY(input.pageHeight, primitive.y1)),
        "30",
        "0",
        "11",
        formatNumber(primitive.x2),
        "21",
        formatNumber(toDxfY(input.pageHeight, primitive.y2)),
        "31",
        "0",
      );
      continue;
    }

    if (primitive.kind === "circle") {
      lines.push(
        "0",
        "CIRCLE",
        "8",
        primitive.layer,
        "10",
        formatNumber(primitive.cx),
        "20",
        formatNumber(toDxfY(input.pageHeight, primitive.cy)),
        "30",
        "0",
        "40",
        formatNumber(Math.max(primitive.r, 0.05)),
      );
      continue;
    }

    if (primitive.kind === "polygon") {
      lines.push(
        "0",
        "LWPOLYLINE",
        "8",
        primitive.layer,
        "90",
        String(primitive.points.length),
        "70",
        "1",
      );
      for (const point of primitive.points) {
        lines.push(
          "10",
          formatNumber(point.x),
          "20",
          formatNumber(toDxfY(input.pageHeight, point.y)),
        );
      }
      continue;
    }

    pushTextEntity(lines, primitive, input.pageHeight);
  }

  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\n");
}
