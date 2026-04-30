/**
 * Логика интерфейса (браузер)
 */
import { getFormInputs, clearForm } from "./components/getInputs.js";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const generateBtn = $("generateBtn");
  const statusEl = $("status");
  const logEl = $("log");

  const log = (message, type = "info") => {
    const time = new Date().toLocaleTimeString("ru-RU");
    const color =
      type === "error" ? "#a80000" : type === "success" ? "#107c10" : "#666";
    logEl.innerHTML += `<div style="color:${color}">[${time}] ${message}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  };

  const setStatus = (message, type = "info") => {
    statusEl.textContent = message;
    statusEl.style.color =
      type === "error" ? "#a80000" : type === "success" ? "#107c10" : "#333";
  };

  generateBtn.addEventListener("click", async () => {
    if (!window.electronAPI?.generateReport) {
      setStatus("❌ Ошибка: API не подключён", "error");
      return;
    }

    const formData = getFormInputs();

    // 🔹 Валидация
    if (!formData.userName || !formData.pgNumber) {
      setStatus("❌ Заполните обязательные поля", "error");
      return;
    }

    // UI: загрузка
    generateBtn.disabled = true;
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = "⏳ Генерация...";
    setStatus("");
    log(`🚀 Запуск: ${formData.userName} | ${formData.pgNumber}`);

    try {
      const result = await window.electronAPI.generateReport(formData);

      if (result.success) {
        setStatus("✅ Файлы созданы!", "success");
        log(`📁 ${result.files?.join(", ")}`, "success");
        clearForm();
      } else {
        setStatus(`❌ ${result.message}`, "error");
        log(`Ошибка: ${result.message}`, "error");
      }
    } catch (err) {
      setStatus(`❌ ${err.message}`, "error");
      log(err.stack || err.message, "error");
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalText;
    }
  });

  log("🔌 Приложение готово", "success");
});
