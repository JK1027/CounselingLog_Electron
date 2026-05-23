const { contextBridge, ipcRenderer } = require('electron')

// ─── Renderer에서 사용할 수 있는 안전한 API 노출 ──────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // 앱 정보
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  // 파일 제어
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  onFileOpened: (callback) => {
    const subscription = (event, filePath) => callback(filePath)
    ipcRenderer.on('menu:file-opened', subscription)
    return () => {
      ipcRenderer.removeListener('menu:file-opened', subscription)
    }
  }
})
