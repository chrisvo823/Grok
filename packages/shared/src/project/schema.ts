import type { NormalizedPinout } from "../types";

export const HARNESS_PROJECT_SCHEMA_VERSION = 1;

export type ProjectActivePage = 1 | 2;

export type ProjectTemplatePage = {
  pageNumber: 1 | 2;
  widthPt: number;
  heightPt: number;
  bitmapWidthPx: number;
  bitmapHeightPx: number;
  imageDataUrl: string;
};

export type ProjectTemplateState = {
  fileName: string;
  pageCount: number;
  pages: [ProjectTemplatePage, ProjectTemplatePage];
};

export type ProjectPage1Fields = {
  overallLength: string;
  labelA: string;
  labelB: string;
  notesText: string;
  revision: {
    rev: string;
    desc: string;
    date: string;
    by: string;
  };
  titleBlock: {
    title: string;
    number: string;
    revision: string;
    sheet: string;
    date: string;
    file: string;
  };
  callouts: Array<{
    id: string;
    value: string;
  }>;
};

export type ProjectPage2State = {
  layout: {
    linePitchMm: number;
    autoExpandConnectorColumns: boolean;
  };
  connectors: {
    leftName: string;
    rightName: string;
    leftSubtitle: string;
    rightSubtitle: string;
  };
};

export type HarnessProjectDocumentV1 = {
  schemaVersion: typeof HARNESS_PROJECT_SCHEMA_VERSION;
  savedAtIso: string;
  template: ProjectTemplateState;
  pinout: {
    sourceName: string;
    normalized: NormalizedPinout;
  };
  page1: ProjectPage1Fields;
  page2: ProjectPage2State;
  ui: {
    activePage: ProjectActivePage;
  };
};

export class ProjectSchemaError extends Error {
  code:
    | "INVALID_JSON"
    | "INVALID_SCHEMA"
    | "UNSUPPORTED_VERSION";

  constructor(
    code: "INVALID_JSON" | "INVALID_SCHEMA" | "UNSUPPORTED_VERSION",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "ProjectSchemaError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ProjectSchemaError("INVALID_SCHEMA", message);
  }
}

function validateTemplatePage(
  input: unknown,
  expectedPageNumber: 1 | 2,
): ProjectTemplatePage {
  assert(isObject(input), `Template page ${expectedPageNumber} must be an object.`);
  assert(input.pageNumber === expectedPageNumber, `Template page number must be ${expectedPageNumber}.`);
  const widthPt = asNumber(input.widthPt);
  const heightPt = asNumber(input.heightPt);
  const bitmapWidthPx = asNumber(input.bitmapWidthPx);
  const bitmapHeightPx = asNumber(input.bitmapHeightPx);
  const imageDataUrl = asString(input.imageDataUrl);
  assert(widthPt !== null && widthPt > 0, "Template page widthPt must be a positive number.");
  assert(heightPt !== null && heightPt > 0, "Template page heightPt must be a positive number.");
  assert(bitmapWidthPx !== null && bitmapWidthPx > 0, "Template page bitmapWidthPx must be positive.");
  assert(bitmapHeightPx !== null && bitmapHeightPx > 0, "Template page bitmapHeightPx must be positive.");
  assert(imageDataUrl && imageDataUrl.startsWith("data:image/"), "Template page imageDataUrl must be a data:image URL.");

  return {
    pageNumber: expectedPageNumber,
    widthPt,
    heightPt,
    bitmapWidthPx,
    bitmapHeightPx,
    imageDataUrl,
  };
}

function validatePage1Fields(input: unknown): ProjectPage1Fields {
  assert(isObject(input), "Page 1 state must be an object.");
  assert(isObject(input.revision), "Page 1 revision block is required.");
  assert(isObject(input.titleBlock), "Page 1 title block is required.");
  assert(Array.isArray(input.callouts), "Page 1 callouts must be an array.");

  const callouts = input.callouts.map((callout, index) => {
    assert(isObject(callout), `Callout ${index + 1} must be an object.`);
    const id = asString(callout.id);
    const value = asString(callout.value);
    assert(id, `Callout ${index + 1} id is required.`);
    assert(value !== null, `Callout ${index + 1} value must be a string.`);
    return { id, value };
  });

  return {
    overallLength: asString(input.overallLength) ?? "",
    labelA: asString(input.labelA) ?? "",
    labelB: asString(input.labelB) ?? "",
    notesText: asString(input.notesText) ?? "",
    revision: {
      rev: asString(input.revision.rev) ?? "",
      desc: asString(input.revision.desc) ?? "",
      date: asString(input.revision.date) ?? "",
      by: asString(input.revision.by) ?? "",
    },
    titleBlock: {
      title: asString(input.titleBlock.title) ?? "",
      number: asString(input.titleBlock.number) ?? "",
      revision: asString(input.titleBlock.revision) ?? "",
      sheet: asString(input.titleBlock.sheet) ?? "",
      date: asString(input.titleBlock.date) ?? "",
      file: asString(input.titleBlock.file) ?? "",
    },
    callouts,
  };
}

function validatePage2State(input: unknown): ProjectPage2State {
  assert(isObject(input), "Page 2 state must be an object.");
  assert(isObject(input.layout), "Page 2 layout is required.");
  assert(isObject(input.connectors), "Page 2 connectors are required.");
  const linePitchMm = asNumber(input.layout.linePitchMm);
  assert(linePitchMm !== null, "Page 2 linePitchMm must be a number.");
  assert(typeof input.layout.autoExpandConnectorColumns === "boolean", "Page 2 autoExpandConnectorColumns must be boolean.");

  return {
    layout: {
      linePitchMm,
      autoExpandConnectorColumns: input.layout.autoExpandConnectorColumns,
    },
    connectors: {
      leftName: asString(input.connectors.leftName) ?? "P2",
      rightName: asString(input.connectors.rightName) ?? "P4",
      leftSubtitle: asString(input.connectors.leftSubtitle) ?? "",
      rightSubtitle: asString(input.connectors.rightSubtitle) ?? "",
    },
  };
}

function validateNormalizedPinout(input: unknown): NormalizedPinout {
  assert(isObject(input), "Pinout normalized data must be an object.");
  assert(Array.isArray(input.rows), "Pinout rows must be an array.");
  const pinCount = asNumber(input.pinCount);
  assert(pinCount !== null && pinCount >= 0, "Pinout pinCount must be a number.");
  assert(isObject(input.diagnostics), "Pinout diagnostics are required.");
  assert(Array.isArray(input.diagnostics.warnings), "Pinout diagnostics warnings must be an array.");

  return input as NormalizedPinout;
}

export function parseProjectDocument(raw: unknown): HarnessProjectDocumentV1 {
  assert(isObject(raw), "Project file must be a JSON object.");
  const version = asNumber(raw.schemaVersion);
  assert(version !== null, "Project schemaVersion is required.");
  if (version !== HARNESS_PROJECT_SCHEMA_VERSION) {
    throw new ProjectSchemaError(
      "UNSUPPORTED_VERSION",
      `Unsupported project schema version: ${version}. Expected ${HARNESS_PROJECT_SCHEMA_VERSION}.`,
    );
  }

  assert(isObject(raw.template), "Project template section is required.");
  const fileName = asString(raw.template.fileName);
  const pageCount = asNumber(raw.template.pageCount);
  assert(fileName, "Template fileName is required.");
  assert(pageCount !== null && pageCount >= 2, "Template pageCount must be at least 2.");
  assert(Array.isArray(raw.template.pages) && raw.template.pages.length >= 2, "Template must contain two page snapshots.");

  const template: ProjectTemplateState = {
    fileName,
    pageCount,
    pages: [
      validateTemplatePage(raw.template.pages[0], 1),
      validateTemplatePage(raw.template.pages[1], 2),
    ],
  };

  assert(isObject(raw.pinout), "Pinout section is required.");
  const sourceName = asString(raw.pinout.sourceName) ?? "pinout";
  const normalized = validateNormalizedPinout(raw.pinout.normalized);
  const page1 = validatePage1Fields(raw.page1);
  const page2 = validatePage2State(raw.page2);
  assert(isObject(raw.ui), "UI section is required.");
  const activePage = raw.ui.activePage === 1 ? 1 : 2;

  return {
    schemaVersion: HARNESS_PROJECT_SCHEMA_VERSION,
    savedAtIso: asString(raw.savedAtIso) ?? new Date().toISOString(),
    template,
    pinout: {
      sourceName,
      normalized,
    },
    page1,
    page2,
    ui: {
      activePage,
    },
  };
}

export function parseProjectJson(text: string): HarnessProjectDocumentV1 {
  try {
    const parsed = JSON.parse(text) as unknown;
    return parseProjectDocument(parsed);
  } catch (error) {
    if (error instanceof ProjectSchemaError) throw error;
    throw new ProjectSchemaError("INVALID_JSON", "Project file is not valid JSON.");
  }
}
