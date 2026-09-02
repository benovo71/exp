const REQUIRED_FIELDS = ["userName", "pgNumber"];

export function normalizeText(value, fallback = "") {
  return String(value ?? fallback)
    .replace(/[\r\n]+/g, " ")
    .trim();
}

export function validateFormData(formData = {}) {
  const data = {
    userName: normalizeText(formData.userName),
    pgNumber: normalizeText(formData.pgNumber),
    issuedBy: normalizeText(formData.issuedBy),
    performedBy: normalizeText(formData.performedBy),
    ticket: normalizeText(formData.ticket),
    intranetName: normalizeText(formData.intranetName),
  };

  const missingField = REQUIRED_FIELDS.find((field) => !data[field]);
  if (missingField === "pgNumber") {
    throw new Error("Не указан PG номер для поиска");
  }
  if (missingField === "userName") {
    throw new Error("Не указано имя пользователя");
  }

  return data;
}

export function sanitizePersonName(value, fallback = "Пользователь") {
  const name = normalizeText(value, fallback)
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return name || fallback;
}

export function sanitizeFileName(value, fallback = "Report") {
  const safeName = normalizeText(value, fallback)
    .replace(/[^\w\-а-яА-ЯёЁ]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");

  return safeName || fallback;
}
