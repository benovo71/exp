import fs from "fs";
import { createReport } from "docx-templates";
import getTodayDate from "./getTodayDate.js";

export default async function generateIssueReport() {
  try {
    const template = fs.readFileSync("./templateIssue.docx");

    const data = {
      name: "Ваня",
      pc: "New PC",
      date: getTodayDate(),
      pgNumber: "PG номер",
    };

    const buffer = await createReport({
      template,
      data,
      cmdDelimiter: ["[", "]"], // ⚠️ Критически важно: совпадает с шаблоном!
      outputType: "nodebuffer",
      failFast: true,
    });

    fs.writeFileSync(`./${data.name}.docx`, buffer);
    console.log(`✅ Готово: ./${data.name}.docx создан`);
  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    if (err.errors) console.error("📋 Детали:", err.errors);
    process.exit(1);
  }
}
