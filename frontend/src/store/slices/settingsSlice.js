import { sessionService } from '@/services/sessionService'
import { studentService } from '@/services/studentService'

export const createSettingsSlice = (set, get) => ({
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  backupDir: '',
  lastBackupTime: localStorage.getItem('counseling_last_backup_time') || '',
  lastBackupStatus: localStorage.getItem('counseling_last_backup_status') || '',

  currentFilePath: '',

  // 자동 업데이트 관련 상태
  appVersion: 'v0.1.0',
  updateStatus: 'idle',
  downloadPercent: 0,
  newVersionInfo: null,
  updateErrorMessage: '',

  setAppVersion: (ver) => set({ appVersion: ver }),
  setUpdateStatus: (status) => set({ updateStatus: status }),
  setDownloadPercent: (percent) => set({ downloadPercent: percent }),
  setNewVersionInfo: (info) => set({ newVersionInfo: info }),
  setUpdateErrorMessage: (msg) => set({ updateErrorMessage: msg }),

  isBackupModalOpen: false,
  setBackupModalOpen: (open) => set({ isBackupModalOpen: open }),

  // 수동 백업 생성
  triggerBackup: async () => {
    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    try {
      const data = await sessionService.triggerBackup()
      
      localStorage.setItem('counseling_last_backup_time', timeStr)
      localStorage.setItem('counseling_last_backup_status', 'success')
      set({ lastBackupTime: timeStr, lastBackupStatus: 'success' })
      
      get().addToast(`백업이 생성되었습니다: ${data.filename}`, 'success')
    } catch (e) {
      localStorage.setItem('counseling_last_backup_time', timeStr)
      localStorage.setItem('counseling_last_backup_status', 'failure')
      set({ lastBackupTime: timeStr, lastBackupStatus: 'failure' })
      
      get().addToast(e.message, 'error')
    }
  },

  // 일렉트론 및 백엔드 설정 로드
  loadSettings: async () => {
    if (window.electronAPI && window.electronAPI.getSettings) {
      try {
        const settings = await window.electronAPI.getSettings()
        const dir = settings.backupDir || ''
        set({ backupDir: dir })
        
        await studentService.syncSettings(dir)
      } catch (e) {
        console.error('Failed to load settings in store:', e)
      }
    }
  },

  // 백업 디렉토리 설정 저장
  saveBackupDir: async (dirPath) => {
    if (window.electronAPI && window.electronAPI.saveSettings) {
      try {
        await window.electronAPI.saveSettings({ backupDir: dirPath })
        set({ backupDir: dirPath })
        
        await studentService.syncSettings(dirPath)
        return true
      } catch (e) {
        get().addToast(e.message, 'error')
        return false
      }
    }
    return false
  },

  // 백업 경로 권한 테스트
  testBackupPath: async (dirPath) => {
    try {
      const data = await studentService.testBackupPath(dirPath)
      if (data.status === 'success') {
        get().addToast('백업 경로 테스트에 성공했습니다. 쓰기 권한이 확인되었습니다.', 'success')
        return true
      } else {
        get().addToast(`백업 경로 테스트 실패: ${data.message}`, 'error')
        return false
      }
    } catch (e) {
      get().addToast(`백업 경로 테스트 에러: ${e.message}`, 'error')
      return false
    }
  },

  // 새로운 엑셀 파일 열기
  openFileByPath: async (filePath) => {
    try {
      const data = await studentService.openFileByPath(filePath)
      set({ 
        currentFilePath: data.excel_path,
        selectedStudent: null,
        sessions: []
      })
      
      await get().initialize()
      get().addToast(`상담일지를 불러왔습니다: ${filePath.split(/[\\/]/).pop()}`, 'success')
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // 자동 업데이트 이벤트 바인딩
  initializeUpdater: () => {
    if (window.electronAPI && window.electronAPI.getVersion) {
      window.electronAPI.getVersion().then(v => set({ appVersion: `v${v}` }))
    }

    if (window.updaterAPI) {
      const unsubAvailable = window.updaterAPI.onUpdateAvailable((info) => {
        set({ newVersionInfo: info, updateStatus: 'available' })
      })
      const unsubNotAvailable = window.updaterAPI.onUpdateNotAvailable(() => {
        set({ updateStatus: 'not-available' })
        setTimeout(() => set({ updateStatus: 'idle' }), 3000)
      })
      const unsubProgress = window.updaterAPI.onDownloadProgress((percent) => {
        set({ downloadPercent: Math.round(percent), updateStatus: 'downloading' })
      })
      const unsubDownloaded = window.updaterAPI.onUpdateDownloaded(() => {
        set({ updateStatus: 'downloaded' })
      })
      const unsubError = window.updaterAPI.onUpdateError((err) => {
        console.error('Update error:', err)
        set({ updateErrorMessage: err || '업데이트 오류', updateStatus: 'error' })
        setTimeout(() => set({ updateStatus: 'idle' }), 5000)
      })

      return () => {
        if (typeof unsubAvailable === 'function') unsubAvailable()
        if (typeof unsubNotAvailable === 'function') unsubNotAvailable()
        if (typeof unsubProgress === 'function') unsubProgress()
        if (typeof unsubDownloaded === 'function') unsubDownloaded()
        if (typeof unsubError === 'function') unsubError()
      }
    }
  }
})
