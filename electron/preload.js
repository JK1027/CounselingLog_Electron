const { contextBridge, ipcRenderer } = require('electron')

// ─── Renderer에서 사용할 수 있는 안전한 API 노출 ──────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // 앱 정보
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  // 3단계에서 추가될 API (FastAPI 연동)
  // getStudents: () => ipcRenderer.invoke('api:students'),
  // getSessions: (studentName) => ipcRenderer.invoke('api:sessions', studentName),
  // saveSession: (data) => ipcRenderer.invoke('api:saveSession', data),
})
