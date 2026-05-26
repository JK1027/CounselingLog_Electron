const { contextBridge, ipcRenderer, webUtils } = require('electron')

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
  },
  
  // DOM File 객체로부터 실제 절대 경로를 안전하게 추출 (Electron 32+ 대응)
  getPathForFile: (file) => webUtils.getPathForFile(file),

  // 설정 제어 및 폴더 탐색기
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory')
})

contextBridge.exposeInMainWorld('updaterAPI', {
  checkForUpdates: () => ipcRenderer.send('updater:check'),
  downloadUpdate: () => ipcRenderer.send('updater:download'),
  quitAndInstall: () => ipcRenderer.send('updater:install'),
  
  onUpdateAvailable: (callback) => {
    const sub = (event, info) => callback(info)
    ipcRenderer.on('update:available', sub)
    return () => ipcRenderer.removeListener('update:available', sub)
  },
  onUpdateNotAvailable: (callback) => {
    const sub = () => callback()
    ipcRenderer.on('update:not-available', sub)
    return () => ipcRenderer.removeListener('update:not-available', sub)
  },
  onDownloadProgress: (callback) => {
    const sub = (event, percent) => callback(percent)
    ipcRenderer.on('update:progress', sub)
    return () => ipcRenderer.removeListener('update:progress', sub)
  },
  onUpdateDownloaded: (callback) => {
    const sub = () => callback()
    ipcRenderer.on('update:downloaded', sub)
    return () => ipcRenderer.removeListener('update:downloaded', sub)
  },
  onUpdateError: (callback) => {
    const sub = (event, err) => callback(err)
    ipcRenderer.on('update:error', sub)
    return () => ipcRenderer.removeListener('update:error', sub)
  }
})

