/**
 * Работа с Excel-файлом.
 * Выполняется только в главном процессе Electron.
 */
import { read, utils } from "xlsx";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const EXCEL_PATH = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  "IT HW equipment.xlsm",
);
const SEARCH_FIELD = "PG Asset PC";
const T_NUMBER_FIELD = "TT-Number";
const ACT_NUMBER_FIELD = "Акт приема передачи №";

let cachedData = null;

function loadExcelData() {
  if (cachedData) return cachedData;

  const buffer = fs.readFileSync(EXCEL_PATH);
  const workbook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json(sheet, { header: 1 });
  const headers = rows[1];

  cachedData = rows.slice(2).map((row) => {
    const result = {};
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined) {
        result[String(header).trim()] = row[index];
      }
    });
    return result;
  });

  return cachedData;
}

export function findPCsByPG(value, field = SEARCH_FIELD) {
  const searchValue = String(value).trim();
  return loadExcelData().filter(
    (row) => String(row[field]).trim() === searchValue,
  );
}

export function findPCByPG(value, field = SEARCH_FIELD) {
  return findPCsByPG(value, field)[0] || null;
}

export function findPCsByTNumber(value) {
  const searchValue = String(value).trim();
  return loadExcelData().filter(
    (row) => String(row[T_NUMBER_FIELD]).trim() === searchValue,
  );
}

export function transformResult(raw) {
  if (!raw) return null;

  const {
    "PC Model": pcModel,
    "PC serial №": pcSerial,
    "PG Asset PC": pgAssetPc,
    "SAP asset \r\nnumber PC": sapAssetNumberPc,
    Type: assetType,
    "Asset type": legacyAssetType,
    [ACT_NUMBER_FIELD]: actNumber,
  } = raw;

  return {
    pcModel: String(pcModel || "").trim(),
    pcSerial: String(pcSerial || "").trim(),
    pgAssetPc: String(pgAssetPc || "").trim(),
    sapAssetNumberPc: String(sapAssetNumberPc || "")
      .replace(/[\r\n]+/g, " ")
      .trim(),
    assetType: String(assetType || legacyAssetType || "").trim(),
    actNumber: String(actNumber || "").trim(),
  };
}
