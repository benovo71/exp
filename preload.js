/**
 * Preload-скрипт: безопасный мост между renderer и main
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  generateReport: (data) => ipcRenderer.invoke("generate-report", data),
  quitApp: () => ipcRenderer.invoke("app-quit"),
});

console.log("✅ Preload loaded | electronAPI exposed");
