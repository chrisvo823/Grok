import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { normalizePinoutRows, parsePinoutFile, PinoutParseError, selectBestWorkbookSheet } from "../index";

describe("normalizePinoutRows", () => {
  it("normalizes aliases, defaults used=true, and sorts by pin mapping", () => {
    const normalized = normalizePinoutRows(
      [
        { P2: "3", P4: "1", "Signal Name": "SIG-C", Colour: "white", TP: "" },
        { P2: "1", P4: "2", "Signal Name": "SIG-A", Colour: "black", TP: "TP2", Used: "" },
        { P2: "2", P4: "3", "Signal Name": "SIG-B", Colour: "Blue", TP: "" },
      ],
      "Ladder_26pin",
      "fixture.csv",
    );

    expect(normalized.rows).toHaveLength(3);
    expect(normalized.rows.map((row) => [row.fromPin, row.toPin])).toEqual([
      [1, 2],
      [2, 3],
      [3, 1],
    ]);
    expect(normalized.rows[0].type).toBe("TP");
    expect(normalized.rows[0].used).toBe(true);
    expect(normalized.rows[0].color).toBe("BLK");
    expect(normalized.rows[1].color).toBe("BLU");
    expect(normalized.rows[2].color).toBe("WHT");
  });

  it("ignores unusable rows but keeps blank labels", () => {
    const normalized = normalizePinoutRows(
      [
        { P2: "A", P4: "1", "Signal Name": "BAD" },
        { P2: "1", P4: "2", "Signal Name": "" },
      ],
      "Pins",
    );

    expect(normalized.rows).toHaveLength(1);
    expect(normalized.rows[0].leftLabel).toBe("");
    expect(normalized.diagnostics.ignoredRows).toBe(1);
  });
});

describe("parsePinoutFile", () => {
  it("parses csv and detects TP from explicit type", () => {
    const csv = ["from pin,to pin,left label,right label,type,used", "1,2,L1,R1,TP,true", "2,3,L2,R2,AWG,0"].join("\n");
    const normalized = parsePinoutFile({
      fileName: "pinout.csv",
      data: csv,
    });

    expect(normalized.diagnostics.selectedSheet).toBe("Sheet1");
    expect(normalized.rows).toHaveLength(2);
    expect(normalized.rows[0].type).toBe("TP");
    expect(normalized.rows[1].used).toBe(false);
  });

  it("prefers Ladder_26pin sheet when available", () => {
    const workbook = XLSX.utils.book_new();
    const miscSheet = XLSX.utils.json_to_sheet([{ any: "data" }]);
    const ladderSheet = XLSX.utils.json_to_sheet([
      { P2: 2, P4: 3, "Signal Name": "B" },
      { P2: 1, P4: 1, "Signal Name": "A" },
    ]);
    XLSX.utils.book_append_sheet(workbook, miscSheet, "Random");
    XLSX.utils.book_append_sheet(workbook, ladderSheet, "Ladder_26pin");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const normalized = parsePinoutFile({
      fileName: "harness.xlsx",
      data: buffer,
    });

    expect(normalized.diagnostics.selectedSheet).toBe("Ladder_26pin");
    expect(normalized.rows.map((row) => row.fromPin)).toEqual([1, 2]);
  });

  it("fails with explicit parse error for malformed workbook bytes", () => {
    expect(() =>
      parsePinoutFile({
        fileName: "pinout.xlsx",
        data: new Uint8Array([0, 1, 2, 3]).buffer,
      }),
    ).toThrow(PinoutParseError);

    try {
      parsePinoutFile({
        fileName: "pinout.xlsx",
        data: new Uint8Array([0, 1, 2, 3]).buffer,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PinoutParseError);
      expect((error as PinoutParseError).code).toBe("MISSING_REQUIRED_COLUMNS");
    }
  });
});

describe("selectBestWorkbookSheet", () => {
  it("fails explicitly when no visible worksheet candidates exist", () => {
    expect(() => selectBestWorkbookSheet([])).toThrow(PinoutParseError);
    try {
      selectBestWorkbookSheet([]);
    } catch (error) {
      expect(error).toBeInstanceOf(PinoutParseError);
      expect((error as PinoutParseError).code).toBe("WORKBOOK_NO_SHEETS");
    }
  });
});
