import fs from "node:fs";

export const ACTS_DIRECTORY = "L:\\IT\\Inventory\\Workstation\\Histori HW";

export function extractActNumber(fileName) {
  const match = fileName.match(/^\s*(\d+)(?=\s|[-_])/);
  return match ? Number(match[1]) : null;
}

export function getNextActNumber(directory = ACTS_DIRECTORY) {
  let files;

  try {
    files = fs.readdirSync(directory);
  } catch (error) {
    throw new Error(
      `Не удалось прочитать папку актов "${directory}". ` +
        "Проверьте доступ к сетевому диску L:",
      { cause: error },
    );
  }

  const actNumbers = files
    .filter((fileName) => fileName.toLowerCase().endsWith(".docx"))
    .map(extractActNumber)
    .filter((number) => number !== null);

  return actNumbers.length ? Math.max(...actNumbers) + 1 : 1;
}
