import type {
  Page1OverlayCallout,
  Page1OverlayFields,
  Page1OverlayMarker,
  Page1OverlayModel,
  Page1OverlayText,
  Page1TemplateAnchorConfig,
} from "../types";
import { layoutPage1Notes, parseNumberedNotes } from "./notes";

function valueOrDash(value: string): string {
  return value.trim() || "—";
}

function markerForNote(number: string): Page1OverlayMarker["type"] | null {
  if (number === "05") return "triangle";
  if (number === "07") return "square";
  return null;
}

function buildNotesTexts(
  fields: Page1OverlayFields,
  anchors: Page1TemplateAnchorConfig,
): { texts: Page1OverlayText[]; markers: Page1OverlayMarker[] } {
  const parsed = parseNumberedNotes(fields.notesText);
  const laidOut = layoutPage1Notes(parsed, anchors.notesRegion);
  const texts: Page1OverlayText[] = [];
  const markers: Page1OverlayMarker[] = [];

  for (const note of laidOut) {
    for (const line of note.lines) {
      if (line.isFirstLine) {
        texts.push({
          id: `note-number-${note.number}-${line.y}`,
          value: `${note.number}.`,
          x: anchors.notesRegion.x,
          y: line.y,
          tone: "fieldLabel",
        });

        const markerType = markerForNote(note.number);
        if (markerType) {
          markers.push({
            id: `note-marker-${note.number}`,
            type: markerType,
            x: anchors.notesRegion.x + anchors.notesRegion.markerOffsetX,
            y: line.y + anchors.notesRegion.markerOffsetY,
            size: anchors.notesRegion.markerSize,
          });
        }
      }

      texts.push({
        id: `note-body-${note.number}-${line.y}`,
        value: line.text,
        x: line.x,
        y: line.y,
        tone: "notes",
      });
    }
  }

  return { texts, markers };
}

function buildRevisionTexts(fields: Page1OverlayFields, anchors: Page1TemplateAnchorConfig): Page1OverlayText[] {
  const labels = ["REV", "DESC", "DATE", "BY"];
  const values = [fields.revision.rev, fields.revision.desc, fields.revision.date, fields.revision.by];
  const texts: Page1OverlayText[] = [];

  labels.forEach((label, index) => {
    const y = anchors.revisionRegion.y + index * anchors.revisionRegion.rowGap;
    texts.push(
      {
        id: `revision-label-${label}`,
        value: label,
        x: anchors.revisionRegion.x,
        y,
        tone: "fieldLabel",
      },
      {
        id: `revision-value-${label}`,
        value: valueOrDash(values[index]),
        x: anchors.revisionRegion.x + anchors.revisionRegion.valueOffsetX,
        y,
        tone: "fieldValue",
      },
    );
  });

  return texts;
}

function buildTitleTexts(fields: Page1OverlayFields, anchors: Page1TemplateAnchorConfig): Page1OverlayText[] {
  const labels = ["TITLE", "NO", "REV", "SHEET", "DATE", "FILE"];
  const values = [
    fields.titleBlock.title,
    fields.titleBlock.number,
    fields.titleBlock.revision,
    fields.titleBlock.sheet,
    fields.titleBlock.date,
    fields.titleBlock.file,
  ];
  const texts: Page1OverlayText[] = [];

  labels.forEach((label, index) => {
    const y = anchors.titleBlockRegion.y + index * anchors.titleBlockRegion.rowGap;
    texts.push(
      {
        id: `title-label-${label}`,
        value: label,
        x: anchors.titleBlockRegion.x,
        y,
        tone: "fieldLabel",
      },
      {
        id: `title-value-${label}`,
        value: valueOrDash(values[index]),
        x: anchors.titleBlockRegion.x + anchors.titleBlockRegion.valueOffsetX,
        y,
        tone: "fieldValue",
      },
    );
  });

  return texts;
}

function buildCallouts(fields: Page1OverlayFields, anchors: Page1TemplateAnchorConfig): Page1OverlayCallout[] {
  const valueById = new Map(fields.callouts.map((callout) => [callout.id, callout.value]));
  return anchors.calloutAnchors.map((anchor) => ({
    id: anchor.id,
    x: anchor.x,
    y: anchor.y,
    radius: anchor.radius,
    value: valueOrDash(valueById.get(anchor.id) ?? ""),
  }));
}

export function buildPage1OverlayModel(
  fields: Page1OverlayFields,
  anchors: Page1TemplateAnchorConfig,
): Page1OverlayModel {
  const { texts: noteTexts, markers } = buildNotesTexts(fields, anchors);
  const revisionTexts = buildRevisionTexts(fields, anchors);
  const titleTexts = buildTitleTexts(fields, anchors);
  const callouts = buildCallouts(fields, anchors);

  const texts: Page1OverlayText[] = [
    {
      id: "overall-length",
      value: valueOrDash(fields.overallLength),
      x: anchors.overallLengthAnchor.x,
      y: anchors.overallLengthAnchor.y,
      textAnchor: "middle",
      tone: "fieldValue",
    },
    {
      id: "label-a",
      value: valueOrDash(fields.labelA),
      x: anchors.labelAAnchor.x,
      y: anchors.labelAAnchor.y,
      textAnchor: "middle",
      tone: "fieldValue",
    },
    {
      id: "label-b",
      value: valueOrDash(fields.labelB),
      x: anchors.labelBAnchor.x,
      y: anchors.labelBAnchor.y,
      textAnchor: "middle",
      tone: "fieldValue",
    },
    ...noteTexts,
    ...revisionTexts,
    ...titleTexts,
    ...callouts.map((callout) => ({
      id: `callout-text-${callout.id}`,
      value: callout.value,
      x: callout.x,
      y: callout.y + anchors.calloutTextOffsetY,
      textAnchor: "middle" as const,
      tone: "callout" as const,
    })),
  ];

  return {
    sceneWidth: anchors.templatePageSizePt.width,
    sceneHeight: anchors.templatePageSizePt.height,
    texts,
    markers,
    callouts,
  };
}
