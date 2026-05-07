/**
 * components/templateIssue.js
 * Генерация .docx документов из шаблонов с помощью docxtemplater
 * Работает только в главном процессе (Node.js)
 */
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import getTodayDate from "./getTodayDate.js";
import { findPCByPG, transformResult } from "./getPC.js";

// Определяем пути относительно этого файла
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, ".."); // Корень проекта

// Пути к шаблонам (должны лежать в корне проекта)
const TEMPLATES = {
  issue: join(ROOT, "test.docx"), // первый шаблон (например, разрешение)
  actIssuing: join(ROOT, "templateIssue.docx"), // второй шаблон (акт)
};

/**
 * Вспомогательная функция для генерации документа из шаблона
 * @param {string} templatePath - путь к .docx шаблону
 * @param {Object} data - данные для подстановки (ключами должны быть названия плейсхолдеров)
 * @returns {Buffer} buffer готового документа
 */
function generateDocxFromTemplate(templatePath, data) {
  // Читаем шаблон как бинарную строку (обязательно 'binary')
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true, // поддержка циклов по абзацам
    linebreaks: true, // поддержка переносов строк
  });
  doc.setData(data);
  doc.render();
  // Возвращаем buffer готового документа
  return doc.getZip().generate({ type: "nodebuffer" });
}

/**
 * Генерирует два .docx файла на основе формы и данных из Excel
 * @param {Object} formData - Данные, пришедшие из renderer (форма)
 * @returns {Promise<Object>} Результат: { success, files, outputDir }
 */
export default async function generateIssueReport(formData = {}) {
  try {
    // 1️⃣ Валидация и поиск ПК в базе
    const pgNumber = formData?.pgNumber?.trim();
    if (!pgNumber) {
      throw new Error("Не указан PG номер для поиска");
    }

    const rawPCData = findPCByPG(pgNumber);
    if (!rawPCData) {
      throw new Error(`ПК с номером "${pgNumber}" не найден в базе Excel`);
    }

    // Преобразуем сырые данные Excel в чистый объект
    const pcData = transformResult(rawPCData);

    // 2️⃣ Сбор финального объекта данных для шаблона
    // Внимание: в .docx шаблонах должны быть плейсхолдеры вида {variable} (одинарные скобки)
    const templateData = {
      // Данные из формы
      userName: String(formData?.userName || "Не указано"),
      pgNumber: String(pgNumber),
      issuedBy: String(formData?.issuedBy || "Не указано"),
      performedBy: String(formData?.performedBy || "Не указано"),

      // Даты (генерируются автоматически)
      date: getTodayDate(),
      issued: getTodayDate(),
      created: getTodayDate(),

      // Системные поля
      actNumber: "1",

      // Данные из Excel
      pcModel: String(pcData?.pcModel || ""),
      pcSerial: String(pcData?.pcSerial || ""),
      pgAssetPc: String(pcData?.pgAssetPc || ""),
      sapAssetNumberPc: String(pcData?.sapAssetNumberPc || "")
        .replace(/[\r\n]+/g, " ")
        .trim(),
      assetType: String(pcData?.assetType || ""),
    };

    // Отладка: проверяем, что все ключи на месте
    console.log("Данные для шаблона:");
    console.table(templateData);

    // 3️⃣ Подготовка путей сохранения
    const safeName = (templateData.userName || "Report")
      .replace(/[^\w\-а-яА-ЯёЁ]/g, "_")
      .replace(/_{2,}/g, "_");

    const filename = `${safeName}_${Date.now()}`;
    const outputDir = join(ROOT, "output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const generatedFiles = [];

    // 4️⃣ Генерация первого файла (test.docx → Permission)
    const buffer1 = generateDocxFromTemplate(TEMPLATES.issue, templateData);
    const path1 = join(outputDir, `${filename}_Permission.docx`);
    fs.writeFileSync(path1, buffer1);
    generatedFiles.push(`${filename}_Permission.docx`);
    console.log(`✅ Создан: ${path1}`);

    // 5️⃣ Генерация второго файла (templateIssue.docx → Act)
    const buffer2 = generateDocxFromTemplate(
      TEMPLATES.actIssuing,
      templateData,
    );
    const path2 = join(outputDir, `${filename}_Act.docx`);
    fs.writeFileSync(path2, buffer2);
    generatedFiles.push(`${filename}_Act.docx`);
    console.log(`✅ Создан: ${path2}`);

    // 6️⃣ Возврат результата
    return {
      success: true,
      message: "Документы успешно созданы",
      files: generatedFiles,
      outputDir,
    };
  } catch (err) {
    console.error("❌ Ошибка в generateIssueReport:", err.message);
    throw err;
  }
}
