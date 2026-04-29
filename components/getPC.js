import { read, utils } from "xlsx";
import * as fs from "fs";

function getPC() {
  const excelPath = "C:\\JS\\exp\\IT HW equipment.xlsm";
  const buffer = fs.readFileSync(excelPath);
  const workbook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json(sheet, { header: 1 });

  const headers = rows[1]; // заголовки на 2-й строке
  const dataRows = rows.slice(2); // данные с 3-й строки

  return dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header != null && header !== "" && row[index]) {
        obj[String(header)] = row[index];
      }
    });
    return obj;
  });
}

// 2. Функция поиска по уже готовым данным
function findValue(tableData, value) {
  const field = "PG Asset PC"; // ← убедитесь, что имя точное!
  const foundRow = tableData.find(
    (row) => String(row[field]) === String(value),
  );
  return foundRow || null;
}

// Получаем данные один раз
const tableData = getPC();

// Ищем нужное значение
const result = findValue(tableData, "PG20200487012");
for (let key in result) {
  console.log(`${result[key]}`);
}

if (result) {
  console.log("Найдено:", result);
} else {
  console.log("Не найдено");
}
