import type { Page2OverlayModel, Page2Scene, ScenePoint } from "../types";
import { PAGE2_BASE_GEOMETRY } from "./config";

function buildWireMetaLabel(sceneWire: Page2Scene["wires"][number]): string {
  const chunks: string[] = [];
  if (sceneWire.source.wireNumber) chunks.push(sceneWire.source.wireNumber);
  if (sceneWire.source.awg) chunks.push(`${sceneWire.source.awg}AWG`);
  if (sceneWire.source.color) chunks.push(sceneWire.source.color);
  if (sceneWire.twistedPair) chunks.push(sceneWire.source.pair || "TP");
  return chunks.join(" · ");
}

function midpoint(start: ScenePoint, end: ScenePoint): ScenePoint {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}

export function buildPage2OverlayModel(scene: Page2Scene): Page2OverlayModel {
  const pinDots: ScenePoint[] = [];
  const pinLabels: Page2OverlayModel["pinLabels"] = [];
  const wires: Page2OverlayModel["wires"] = [];
  const texts: Page2OverlayModel["texts"] = [];
  const figure8Markers: Page2OverlayModel["figure8Markers"] = [];

  texts.push(
    {
      id: "left-heading",
      value: scene.leftColumn.name,
      x: scene.leftColumn.x + scene.leftColumn.width / 2,
      y: PAGE2_BASE_GEOMETRY.headingY,
      textAnchor: "middle",
      tone: "heading",
    },
    {
      id: "right-heading",
      value: scene.rightColumn.name,
      x: scene.rightColumn.x + scene.rightColumn.width / 2,
      y: PAGE2_BASE_GEOMETRY.headingY,
      textAnchor: "middle",
      tone: "heading",
    },
    {
      id: "left-subheading",
      value: scene.leftColumn.subtitle,
      x: scene.leftColumn.x + scene.leftColumn.width / 2,
      y: PAGE2_BASE_GEOMETRY.subtitleY,
      textAnchor: "middle",
      tone: "subheading",
    },
    {
      id: "right-subheading",
      value: scene.rightColumn.subtitle,
      x: scene.rightColumn.x + scene.rightColumn.width / 2,
      y: PAGE2_BASE_GEOMETRY.subtitleY,
      textAnchor: "middle",
      tone: "subheading",
    },
  );

  for (const row of scene.pinRows) {
    pinDots.push(row.leftDot, row.rightDot);
    pinLabels.push(
      {
        id: `left-pin-${row.pin}`,
        value: String(row.pin),
        x: scene.leftColumn.x + scene.leftColumn.width - 5,
        y: row.y + 2,
        textAnchor: "end",
      },
      {
        id: `right-pin-${row.pin}`,
        value: String(row.pin),
        x: scene.rightColumn.x + 5,
        y: row.y + 2,
        textAnchor: "start",
      },
    );
  }

  for (const sceneWire of scene.wires) {
    wires.push({
      id: sceneWire.id,
      x1: sceneWire.start.x,
      y1: sceneWire.start.y,
      x2: sceneWire.end.x,
      y2: sceneWire.end.y,
    });

    texts.push(
      {
        id: `${sceneWire.id}-left-label`,
        value: sceneWire.leftLabel,
        x: sceneWire.leftLabelPos.x,
        y: sceneWire.leftLabelPos.y,
        tone: "labelLeft",
      },
      {
        id: `${sceneWire.id}-right-label`,
        value: sceneWire.rightLabel,
        x: sceneWire.rightLabelPos.x,
        y: sceneWire.rightLabelPos.y,
        textAnchor: "end",
        tone: "labelRight",
      },
    );

    const wireMeta = buildWireMetaLabel(sceneWire);
    if (wireMeta) {
      const middle = midpoint(sceneWire.start, sceneWire.end);
      texts.push({
        id: `${sceneWire.id}-meta`,
        value: wireMeta,
        x: middle.x,
        y: middle.y - 1.6,
        textAnchor: "middle",
        tone: "meta",
      });
    }

    if (sceneWire.leftTpMarkerCenter && sceneWire.rightTpMarkerCenter) {
      figure8Markers.push(
        {
          id: `${sceneWire.id}-left-top`,
          x: sceneWire.leftTpMarkerCenter.x,
          y: sceneWire.leftTpMarkerCenter.y - PAGE2_BASE_GEOMETRY.tpMarkerOffsetY,
          radius: 1.5,
        },
        {
          id: `${sceneWire.id}-left-bottom`,
          x: sceneWire.leftTpMarkerCenter.x,
          y: sceneWire.leftTpMarkerCenter.y + PAGE2_BASE_GEOMETRY.tpMarkerOffsetY,
          radius: 1.5,
        },
        {
          id: `${sceneWire.id}-right-top`,
          x: sceneWire.rightTpMarkerCenter.x,
          y: sceneWire.rightTpMarkerCenter.y - PAGE2_BASE_GEOMETRY.tpMarkerOffsetY,
          radius: 1.5,
        },
        {
          id: `${sceneWire.id}-right-bottom`,
          x: sceneWire.rightTpMarkerCenter.x,
          y: sceneWire.rightTpMarkerCenter.y + PAGE2_BASE_GEOMETRY.tpMarkerOffsetY,
          radius: 1.5,
        },
      );
    }
  }

  return {
    sceneWidth: scene.pageSize.width,
    sceneHeight: scene.pageSize.height,
    pinDots,
    pinLabels,
    wires,
    texts,
    figure8Markers,
  };
}
