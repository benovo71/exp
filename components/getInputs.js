/**
 * Сбор данных из формы (без дат — они генерируются автоматически)
 * @returns {Object} Данные полей
 */
export function getFormInputs() {
  const getValue = (id) => document.getElementById(id)?.value?.trim() || "";

  return {
    userName: getValue("userName"),
    pgNumber: getValue("pgNumber"),
    issuedBy: getValue("issuedBy"),
    performedBy: getValue("performedBy"),
    ticket: getValue("ticket"),
    intranetName: getValue("intranetName"),
    adviros: document.getElementById("adviros")?.checked ?? false,
    surrender: document.getElementById("surrender")?.checked ?? false,
  };
}

/**
 * Очистка всех полей формы
 */
export function clearForm() {
  ["userName", "pgNumber", "issuedBy", "performedBy"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}
