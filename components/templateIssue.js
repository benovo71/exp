/**
 * Генерация документов выдачи и сдачи компьютера.
 * Выполняется только в главном процессе Electron.
 */
import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import getTodayDate from "./getTodayDate.js";
import {
  findPCByPG,
  findPCsByPG,
  findPCsByTNumber,
  transformResult,
} from "./getPC.js";
import { getNextActNumber } from "./actNumber.js";
import { appendHistoryRows, buildHistoryRow } from "./computerHistory.js";
import { selectComputersForTransfer, isLaptop } from "./ownershipTransfer.js";
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
  acceptanceAct: join(PROJECT_ROOT, "templateActOfAcceptancePC.docx"),
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
  return document.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
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
    department: formData.adviros ? "Adviros" : "PG",
    date: today,
    issued: today,
    created: today,
    actNumber: normalizeText(pcData.actNumber, "1"),
    pcModel: normalizeText(pcData.pcModel),
    pcSerial: normalizeText(pcData.pcSerial),
    pgAssetPc: normalizeText(pcData.pgAssetPc),
    sapAssetNumberPc: normalizeText(pcData.sapAssetNumberPc),
    assetType: normalizeText(pcData.assetType),
    conformity: formData.broken
      ? `не соответствует: ${normalizeText(formData.brokenDescription)}`
      : "соответствует:",
  };

}

function saveReport(buffer, fileName) {
  fs.writeFileSync(join(OUTPUT_DIR, fileName), buffer);
  return fileName;
}

function generateIssueReports(formData) {
  const rawPCData = findPCByPG(formData.pgNumber);
  if (!rawPCData) {
    throw new Error(`ПК с номером "${formData.pgNumber}" не найден в базе Excel`);
  }

  assertRequiredFile(TEMPLATES.permission, "шаблон разрешения");
  assertRequiredFile(TEMPLATES.issueAct, "шаблон акта выдачи");
  assertRequiredFile(TEMPLATES.checklist, "шаблон чеклиста");

  const templateData = buildTemplateData(formData, transformResult(rawPCData));
  const personName = sanitizePersonName(templateData.userName);
  const baseName = `${sanitizeFileName(templateData.userName)}_${Date.now()}`;
  const actNumber = getNextActNumber();

  templateData.actNumber = String(actNumber);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = [
    saveReport(
      renderDocx(TEMPLATES.permission, templateData),
      `${baseName}_Permission.docx`,
    ),
    saveReport(
      renderDocx(TEMPLATES.issueAct, templateData),
      `${actNumber} ${personName}.docx`,
    ),
    saveReport(
      renderDocx(TEMPLATES.checklist, templateData),
      `${templateData.pgNumber}.docx`,
    ),
  ];

  appendHistoryRows([
    buildHistoryRow({
      operation: "issue",
      ...transformResult(rawPCData),
      actNumber,
      intranetName: formData.intranetName,
      userName: formData.userName,
      performedBy: formData.performedBy,
      date: new Date(),
    }),
  ]);

  return { files, matches: [] };
}

function generateSurrenderReports(formData) {
  const rawPCs = findPCsByPG(formData.pgNumber);
  if (!rawPCs.length) {
    throw new Error(
      `Компьютер с PG номером "${formData.pgNumber}" не найден в базе Excel`,
    );
  }

  assertRequiredFile(TEMPLATES.acceptanceAct, "шаблон акта сдачи");

  const computers = rawPCs.map(transformResult);
  const missingActNumber = computers.find((computer) => !computer.actNumber);
  if (missingActNumber) {
    throw new Error(
      `У компьютера ${missingActNumber.pgAssetPc || "без PG номера"} ` +
        "не указан номер акта приема-передачи в Excel",
    );
  }

  const personName = sanitizePersonName(formData.userName);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = computers.slice(0, 1).map((computer) => {
    const templateData = buildTemplateData(
      formData,
      { ...computer, actNumber: `${computer.actNumber}_1` },
    );
    const fileName = `${computer.actNumber}_1 ${personName}.docx`;
    return saveReport(renderDocx(TEMPLATES.acceptanceAct, templateData), fileName);
  });

  appendHistoryRows(
    computers.slice(0, 1).map((computer) =>
      buildHistoryRow({
        operation: "surrender",
        ...computer,
        userName: formData.userName,
        performedBy: formData.performedBy,
        broken: formData.broken,
        date: new Date(),
      }),
    ),
  );

  return {
    files,
    matches: computers.map((computer) => ({
      pgAssetPc: computer.pgAssetPc,
      pcModel: computer.pcModel,
      pcSerial: computer.pcSerial,
      actNumber: computer.actNumber,
    })),
  };
}

function generateOwnerChangeReports(formData) {
  const rawPCs = findPCsByTNumber(formData.tNumber);
  if (!rawPCs.length) {
    throw new Error(
      `Компьютеры владельца с T number "${formData.tNumber}" не найдены в базе Excel`,
    );
  }

  assertRequiredFile(TEMPLATES.issueAct, "шаблон акта выдачи");

  const allComputers = rawPCs.map(transformResult);
  const transfer = selectComputersForTransfer(allComputers);
  if (!transfer.computers.length) {
    throw new Error(
      "После исключения единственного лэптопа не осталось компьютеров для передачи",
    );
  }

  const newOwner = sanitizePersonName(formData.newOwner);
  const firstNewActNumber = getNextActNumber();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = [];
  transfer.computers.forEach((computer, index) => {
    const newActNumber = String(firstNewActNumber + index);
    const issueData = buildTemplateData(
      { ...formData, userName: newOwner },
      { ...computer, actNumber: newActNumber },
    );
    files.push(
      saveReport(
        renderDocx(TEMPLATES.issueAct, issueData),
        `${newActNumber} ${newOwner}.docx`,
      ),
    );
  });

  appendHistoryRows(
    transfer.computers.map((computer, index) =>
      buildHistoryRow({
        operation: "issue",
        ...computer,
        actNumber: firstNewActNumber + index,
        intranetName: formData.intranetName,
        userName: newOwner,
        performedBy: formData.performedBy,
        date: new Date(),
      }),
    ),
  );

  return {
    files,
    notices:
      transfer.laptopCount > 0
        ? [
            `Лэптопы не передаются (найдено: ${transfer.laptopCount}): ` +
              transfer.laptops
                .map((computer) => computer.pgAssetPc || "без PG")
                .join(", "),
          ]
        : [],
    matches: allComputers.map((computer) => ({
      pgAssetPc: computer.pgAssetPc,
      pcModel: computer.pcModel,
      pcSerial: computer.pcSerial,
      actNumber: computer.actNumber,
      isLaptop: isLaptop(computer.assetType),
    })),
  };
}

/**
 * Генерирует документы выдачи или сдачи компьютера.
 * @param {Object} formData — данные формы
 * @returns {{success: boolean, message: string, files: string[], outputDir: string, matches: Object[]}}
 */
export default function generateIssueReport(formData = {}) {
  const validatedFormData = validateFormData(formData);
  const result = validatedFormData.ownerChange
    ? generateOwnerChangeReports(validatedFormData)
    : validatedFormData.surrender
      ? generateSurrenderReports(validatedFormData)
      : generateIssueReports(validatedFormData);

  return {
    success: true,
    message: "Документы успешно созданы",
    files: result.files,
    outputDir: OUTPUT_DIR,
    matches: result.matches,
    notices: result.notices ?? [],
  };
}
