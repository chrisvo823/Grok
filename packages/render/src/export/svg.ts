import type { ExportPrimitive } from "./primitives";

type ExportSvgDocumentInput = {
  width: number;
  height: number;
  backgroundImageDataUrl?: string;
  primitives: ExportPrimitive[];
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function primitiveToSvg(primitive: ExportPrimitive): string {
  if (primitive.kind === "line") {
    return `<line x1="${primitive.x1}" y1="${primitive.y1}" x2="${primitive.x2}" y2="${primitive.y2}" stroke="${primitive.stroke}" stroke-width="${primitive.strokeWidth}" />`;
  }
  if (primitive.kind === "circle") {
    const fill = primitive.fill ? ` fill="${primitive.fill}"` : ` fill="none"`;
    return `<circle cx="${primitive.cx}" cy="${primitive.cy}" r="${primitive.r}" stroke="${primitive.stroke}" stroke-width="${primitive.strokeWidth}"${fill} />`;
  }
  if (primitive.kind === "polygon") {
    const points = primitive.points.map((point) => `${point.x},${point.y}`).join(" ");
    const fill = primitive.fill ? primitive.fill : "none";
    return `<polygon points="${points}" stroke="${primitive.stroke}" stroke-width="${primitive.strokeWidth}" fill="${fill}" />`;
  }
  const anchor = primitive.anchor ? ` text-anchor="${primitive.anchor}"` : "";
  return `<text x="${primitive.x}" y="${primitive.y}"${anchor} font-family="Arial, sans-serif" font-size="${primitive.size}" fill="${primitive.fill}">${escapeXml(primitive.text)}</text>`;
}

export function exportSvgDocument(input: ExportSvgDocumentInput): string {
  const content: string[] = [];
  if (input.backgroundImageDataUrl) {
    content.push(
      `<image href="${input.backgroundImageDataUrl}" x="0" y="0" width="${input.width}" height="${input.height}" preserveAspectRatio="none" />`,
    );
  }
  for (const primitive of input.primitives) {
    content.push(primitiveToSvg(primitive));
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}">`,
    ...content,
    `</svg>`,
  ].join("\n");
}
