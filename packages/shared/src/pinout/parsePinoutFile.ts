import * as XLSX from "xlsx";
import type { NormalizedPinout, ParsePinoutFileInput, ParsePinoutUploadInput, PinoutFileKind } from "../types";
import { PinoutParseError } from "./errors";
import { normalizePinoutRows } from "./normalizePinoutRows";
import { selectBestWorkbookSheet } from "./selectWorkbookSheet";

function inferFileKind(fileName: string): PinoutFileKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  if (lower.endsWith(".csv")) return "csv";
  throw new PinoutParseError(
    "UNSUPPORTED_EXTENSION",
    "Unsupported pinout file extension. Accepted: .xlsx, .xls, .csv",
  );
}

function parseWorkbook(data: ArrayBuffer | string, kind: PinoutFileKind): XLSX.WorkBook {
  try {
    if (kind === "csv") {
      const text = typeof data === "string" ? data : new TextDecoder().decode(data);
      return XLSX.read(text, { type: "string", raw: false });
    }

    const arrayBuffer = typeof data === "string" ? new TextEncoder().encode(data).buffer : data;
    return XLSX.read(arrayBuffer, { type: "array", raw: false });
  } catch {
    throw new PinoutParseError("WORKBOOK_READ_FAILED", "Pinout workbook could not be read.");
  }
}

export function parsePinoutFile(input: ParsePinoutFileInput): NormalizedPinout {
  const kind = inferFileKind(input.fileName);
  const workbook = parseWorkbook(input.data, kind);
  if (workbook.SheetNames.length === 0) {
    throw new PinoutParseError("WORKBOOK_EMPTY", "Workbook has no readable worksheets.");
  }

  const candidates = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });

    return {
      sheetName,
      rows,
    };
  });

  const selected = selectBestWorkbookSheet(candidates);
  return normalizePinoutRows(selected.rows, selected.sheetName, input.sourceName ?? input.fileName);
}

export async function parsePinoutUpload(upload: ParsePinoutUploadInput): Promise<NormalizedPinout> {
  const kind = inferFileKind(upload.name);
  const data = kind === "csv" ? await upload.text() : await upload.arrayBuffer();
  return parsePinoutFile({
    fileName: upload.name,
    data,
    sourceName: upload.name,
  });
}
