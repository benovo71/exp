/**
 * Генерация разрешения и акта выдачи компьютера.
 * Выполняется только в главном процессе Electron.
 */
import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import getTodayDate from "./getTodayDate.js";
import { findPCByPG, transformResult } from "./getPC.js";
import { getNextActNumber } from "./actNumber.js";
import {
  normalizeText,
  sanitizeFileName,
  sanitizePersonName,
  validateFormData,
} from "./validation.js";

const PROJECT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = join(PROJECT_ROOT, "output");

const TEMPLATES = {
  permission: join(PROJECT_ROOT, "templateIssue.docx"),
  issueAct: join(PROJECT_ROOT, "templateActOfIssuingPC.docx"),
  checklist: join(PROJECT_ROOT, "checklist.docx"),
};

function assertRequiredFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Не найден ${description}: ${filePath}`);
  }
}

function renderDocx(templatePath, data) {
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const document = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  document.render(data);
  return document.getZip().generate({ type: "nodebuffer" });
}

function buildTemplateData(formData, pcData) {
  const today = getTodayDate();

  return {
    userName: normalizeText(formData.userName, "Не указано"),
    pgNumber: normalizeText(formData.pgNumber),
    issuedBy: normalizeText(formData.issuedBy, "Не указано"),
    performedBy: normalizeText(formData.performedBy, "Не указано"),
    ticket: normalizeText(formData.ticket, "Не указано"),
    intranetName: normalizeText(formData.intranetName, "Не указано"),
    date: today,
    issued: today,
    created: today,
    actNumber: "1",
    pcModel: normalizeText(pcData.pcModel),
    pcSerial: normalizeText(pcData.pcSerial),
    pgAssetPc: normalizeText(pcData.pgAssetPc),
    sapAssetNumberPc: normalizeText(pcData.sapAssetNumberPc),
    assetType: normalizeText(pcData.assetType),
  };
}

function saveReport(buffer, fileName) {
  fs.writeFileSync(join(OUTPUT_DIR, fileName), buffer);
  return fileName;
}

/**
 * Генерирует разрешение, акт выдачи и чеклист на основе формы и Excel-базы.
 * @param {Object} formData — данные формы
 * @returns {{success: boolean, message: string, files: string[], outputDir: string}}
 */
export default function generateIssueReport(formData = {}) {
  const validatedFormData = validateFormData(formData);
  const rawPCData = findPCByPG(validatedFormData.pgNumber);

  if (!rawPCData) {
    throw new Error(
      `ПК с номером "${validatedFormData.pgNumber}" не найден в базе Excel`,
    );
  }

  assertRequiredFile(TEMPLATES.permission, "шаблон разрешения");
  assertRequiredFile(TEMPLATES.issueAct, "шаблон акта выдачи");
  assertRequiredFile(TEMPLATES.checklist, "шаблон чеклиста");

  const templateData = buildTemplateData(
    validatedFormData,
    transformResult(rawPCData),
  );
  const actNumber = getNextActNumber();
  const personName = sanitizePersonName(templateData.userName);
  const permissionFileName = `${sanitizeFileName(templateData.userName)}_${Date.now()}_Permission.docx`;
  const actFileName = `${actNumber} ${personName}.docx`;
  const checklistFileName = `${templateData.pgNumber}.docx`;

  templateData.actNumber = String(actNumber);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = [
    saveReport(
      renderDocx(TEMPLATES.permission, templateData),
      permissionFileName,
    ),
    saveReport(renderDocx(TEMPLATES.issueAct, templateData), actFileName),
    saveReport(
      renderDocx(TEMPLATES.checklist, templateData),
      checklistFileName,
    ),
  ];

  return {
    success: true,
    message: "Документы успешно созданы",
    files,
    outputDir: OUTPUT_DIR,
  };
}
