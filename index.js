/**
 * Главный процесс Electron
 */
import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import generateIssueReport from "./components/templateIssue.js";

// index.js
ipcMain.handle("generate-report", async (event, formData) => {
  console.log("📥 Получено из renderer:", formData);
  console.log("🔑 Ключи:", Object.keys(formData || {}));

  try {
    const result = await generateIssueReport(formData);
    return { success: true, message: "Готово", files: result.files };
  } catch (err) {
    console.error("❌ Ошибка в main:", err.message);
    return { success: false, message: err.message };
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(join(__dirname, "index.html"));
  // win.webContents.openDevTools(); // для отладки
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─────────────────────────────────────────────────────────────
// IPC Обработчики
// ─────────────────────────────────────────────────────────────

ipcMain.handle("generate-report", async (event, formData) => {
  try {
    console.log("📥 Данные:", formData);
    const result = await generateIssueReport(formData);

    return {
      success: true,
      message: "Документы созданы",
      files: result.files,
      outputDir: result.outputDir,
    };
  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    return { success: false, message: err.message };
  }
});

ipcMain.handle("app-quit", () => app.quit());
