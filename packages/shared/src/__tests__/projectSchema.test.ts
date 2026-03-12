import { describe, expect, it } from "vitest";
import {
  HARNESS_PROJECT_SCHEMA_VERSION,
  ProjectSchemaError,
  parseProjectDocument,
  parseProjectJson,
  type HarnessProjectDocumentV1,
} from "../index";

function buildFixture(): HarnessProjectDocumentV1 {
  return {
    schemaVersion: HARNESS_PROJECT_SCHEMA_VERSION,
    savedAtIso: "2026-03-11T00:00:00.000Z",
    template: {
      fileName: "Template.pdf",
      pageCount: 2,
      pages: [
        {
          pageNumber: 1,
          widthPt: 720,
          heightPt: 405,
          bitmapWidthPx: 1800,
          bitmapHeightPx: 1013,
          imageDataUrl: "data:image/png;base64,AAA",
        },
        {
          pageNumber: 2,
          widthPt: 720,
          heightPt: 405,
          bitmapWidthPx: 1800,
          bitmapHeightPx: 1013,
          imageDataUrl: "data:image/png;base64,BBB",
        },
      ],
    },
    pinout: {
      sourceName: "Pinout.xlsx",
      normalized: {
        rows: [],
        pinCount: 26,
        diagnostics: {
          selectedSheet: "Ladder_26pin",
          ignoredRows: 0,
          warnings: [],
        },
      },
    },
    page1: {
      overallLength: "150 MM",
      labelA: "FRONT",
      labelB: "REAR",
      notesText: "01 NOTE",
      revision: {
        rev: "B02",
        desc: "INITIAL",
        date: "16-FEB-26",
        by: "JOHN",
      },
      titleBlock: {
        title: "HARNESS",
        number: "D-1001",
        revision: "B",
        sheet: "1/2",
        date: "",
        file: "",
      },
      callouts: [{ id: "callout_1", value: "01" }],
    },
    page2: {
      layout: {
        linePitchMm: 9.5,
        autoExpandConnectorColumns: true,
      },
      connectors: {
        leftName: "P2",
        rightName: "P4",
        leftSubtitle: "LEFT",
        rightSubtitle: "RIGHT",
      },
    },
    ui: {
      activePage: 1,
    },
  };
}

describe("project schema parsing", () => {
  it("parses valid project object deterministically", () => {
    const fixture = buildFixture();
    const parsed = parseProjectDocument(fixture);
    expect(parsed.schemaVersion).toBe(HARNESS_PROJECT_SCHEMA_VERSION);
    expect(parsed.template.fileName).toBe("Template.pdf");
    expect(parsed.pinout.normalized.pinCount).toBe(26);
    expect(parsed.page1.revision.rev).toBe("B02");
    expect(parsed.page2.layout.linePitchMm).toBe(9.5);
    expect(parsed.ui.activePage).toBe(1);
  });

  it("rejects unsupported version", () => {
    const fixture = buildFixture();
    expect(() => parseProjectDocument({ ...fixture, schemaVersion: 99 })).toThrow(ProjectSchemaError);
  });

  it("rejects invalid json text", () => {
    expect(() => parseProjectJson("{ this is invalid json }")).toThrow(ProjectSchemaError);
  });

  it("rejects project snapshots with missing template image data", () => {
    const fixture = buildFixture();
    fixture.template.pages[1].imageDataUrl = "";
    expect(() => parseProjectDocument(fixture)).toThrow(ProjectSchemaError);
  });
});
