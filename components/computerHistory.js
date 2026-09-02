import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import XLSX from "xlsx";

const { readFile, utils, writeFile } = XLSX;

const PROJECT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const HISTORY_PATH = join(PROJECT_ROOT, "ComputerHistory.xlsx");

export const HISTORY_HEADERS = [
  "Акт",
  "Модель",
  "Серийный номер",
  "PG Asset PC",
  "SAP asset number PC",
  "Тип",
  "Локация",
  "Статус до",
  "Статус после",
  "Дата",
  "Intranet / место хранения",
  "Пользователь",
  "Кто осуществил",
];

function text(value) {
  return String(value ?? "").trim();
}

export function buildHistoryRow(data) {
  const isSurrender = data.operation === "surrender";
  const actNumber = isSurrender ? `${text(data.actNumber)}_1` : text(data.actNumber);

  return [
    actNumber,
    text(data.pcModel),
    text(data.pcSerial),
    text(data.pgAssetPc),
    text(data.sapAssetNumberPc),
    text(data.assetType),
    text(data.location || "P&G Novomoskovsk Plant (LE 614)"),
    isSurrender ? "In use" : "On stock",
    isSurrender ? "On stock" : "In use",
    data.date instanceof Date ? data.date : new Date(data.date || Date.now()),
    text(data.intranetName || (isSurrender ? "IT Stock" : "")),
    text(data.userName),
    text(data.performedBy),
  ];
}

function applyDateFormat(sheet, rowIndex) {
  const cell = sheet[`${"J"}${rowIndex + 1}`];
  if (cell) cell.z = "dd.mm.yyyy";
}

export function appendHistoryRows(rows, filePath = HISTORY_PATH) {
  let data = [HISTORY_HEADERS];

  if (fs.existsSync(filePath)) {
    const workbook = readFile(filePath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = utils.sheet_to_json(sheet, { header: 1, raw: true });
    if (!data.length) data = [HISTORY_HEADERS];
  }

  const sheet = utils.aoa_to_sheet([...data, ...rows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, "History");

  for (let index = 1; index < data.length + rows.length; index += 1) {
    applyDateFormat(sheet, index);
  }

  writeFile(workbook, filePath, { cellDates: true });
  return filePath;
}
