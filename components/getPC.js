/**
 * Работа с Excel-файлом
 * ⚠️ Только для главного процесса (Node.js)
 */
import { read, utils } from "xlsx";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXCEL_PATH = join(__dirname, "..", "IT HW equipment.xlsm");
const SEARCH_FIELD = "PG Asset PC";

let _cachedData = null;

function loadExcelData() {
  if (_cachedData) return _cachedData;

  const buffer = fs.readFileSync(EXCEL_PATH);
  const workbook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json(sheet, { header: 1 });

  const headers = rows[1];
  const dataRows = rows.slice(2);

  _cachedData = dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined) {
        obj[String(header).trim()] = row[index];
      }
    });
    return obj;
  });

  return _cachedData;
}

export function findPCByPG(value, field = SEARCH_FIELD) {
  const data = loadExcelData();
  const searchValue = String(value).trim();
  return data.find((row) => String(row[field]).trim() === searchValue) || null;
}

export function transformResult(raw) {
  if (!raw) return null;

  const {
    "PC Model": pcModel,
    "PC serial №": pcSerial,
    "PG Asset PC": pgAssetPc,
    "SAP asset \r\nnumber PC": sapAssetNumberPc,
    "Asset type": assetType,
  } = raw;

  return {
    pcModel: String(pcModel || "").trim(),
    pcSerial: String(pcSerial || "").trim(),
    pgAssetPc: String(pgAssetPc || "").trim(),
    sapAssetNumberPc: String(sapAssetNumberPc || "")
      .replace(/[\r\n]+/g, " ")
      .trim(),
    assetType: String(assetType || "").trim(),
  };
}
