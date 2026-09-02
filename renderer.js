import { getFormInputs } from "./components/getInputs.js";

const STATUS_COLORS = {
  info: "#333",
  success: "#107c10",
  error: "#a80000",
};

function getTime() {
  return new Date().toLocaleTimeString("ru-RU");
}

document.addEventListener("DOMContentLoaded", () => {
  const reportForm = document.getElementById("reportForm");
  const generateButton = document.getElementById("generateBtn");
  const statusElement = document.getElementById("status");
  const logElement = document.getElementById("log");

  function addLog(message, type = "info") {
    const entry = document.createElement("div");
    entry.className = `log-entry log-entry--${type}`;
    entry.textContent = `[${getTime()}] ${message}`;
    logElement.append(entry);
    logElement.scrollTop = logElement.scrollHeight;
  }

  function setStatus(message, type = "info") {
    statusElement.textContent = message;
    statusElement.style.color = STATUS_COLORS[type] ?? STATUS_COLORS.info;
  }

  function setGeneratingState(isGenerating) {
    generateButton.disabled = isGenerating;
    generateButton.textContent = isGenerating
      ? "⏳ Генерация..."
      : "🚀 Сгенерировать";
  }

  reportForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!window.electronAPI?.generateReport) {
      setStatus("❌ Ошибка: API не подключён", "error");
      return;
    }

    if (!reportForm.checkValidity()) {
      reportForm.reportValidity();
      setStatus("❌ Заполните обязательные поля", "error");
      return;
    }

    const formData = getFormInputs();
    setGeneratingState(true);
    setStatus("");
    addLog(`🚀 Запуск: ${formData.userName} | ${formData.pgNumber}`);

    try {
      const result = await window.electronAPI.generateReport(formData);

      if (result.success) {
        setStatus("✅ Файлы созданы!", "success");
        addLog(`📁 ${result.files?.join(", ")}`, "success");
      } else {
        setStatus(`❌ ${result.message}`, "error");
        addLog(`Ошибка: ${result.message}`, "error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`❌ ${message}`, "error");
      addLog(message, "error");
    } finally {
      setGeneratingState(false);
    }
  });

  addLog("🔌 Приложение готово", "success");
});
