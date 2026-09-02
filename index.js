/**
 * Главный процесс Electron
 */
import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import generateIssueReport from "./components/templateIssue.js";

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

// ─────────────────────────────────────────────────────────────
// IPC Обработчики
// ─────────────────────────────────────────────────────────────

ipcMain.handle("generate-report", async (_event, formData) => {
  try {
    const result = await generateIssueReport(formData);
    return {
      success: true,
      message: "Документы созданы",
      files: result.files,
      outputDir: result.outputDir,
      matches: result.matches,
    };
  } catch (err) {
    console.error("❌ Ошибка в main:", err.message);
    return { success: false, message: err.message };
  }
});

ipcMain.handle("app-quit", () => app.quit());

// ─────────────────────────────────────────────────────────────
// Жизненный цикл приложения
// ─────────────────────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
