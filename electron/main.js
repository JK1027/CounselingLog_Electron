const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { autoUpdater } = require('electron-updater')
const http = require('http')
const fs = require('fs')

const isDev = !app.isPackaged

let mainWindow = null
let pythonProcess = null

// ─── Python FastAPI 백엔드 시작 및 헬스 체크 ─────────────────────────────────────────────
function startPythonBackend() {
  let pythonBin = ''
  let args = []
  let cwd = ''

  if (isDev) {
    const backendPath = path.join(__dirname, '../backend')
    cwd = path.join(__dirname, '..')
    
    // 가상환경 Python 경로 탐색
    const venvPythonPathWin = path.join(backendPath, 'venv/Scripts/python.exe')
    const venvPythonPathUnix = path.join(backendPath, 'venv/bin/python')
    pythonBin = 'python'

    if (fs.existsSync(venvPythonPathWin)) {
      pythonBin = venvPythonPathWin
    } else if (fs.existsSync(venvPythonPathUnix)) {
      pythonBin = venvPythonPathUnix
    }

    args = ['-m', 'uvicorn', 'backend.main:app', '--port', '8765']
  } else {
    // 프로덕션 패키징 환경
    pythonBin = path.join(process.resourcesPath, 'backend', 'backend.exe')
    cwd = path.dirname(pythonBin)
    args = []
  }

  console.log(`[Electron] Starting Python backend from ${pythonBin}... (cwd: ${cwd})`)

  pythonProcess = spawn(pythonBin, args, {
    cwd: cwd,
    stdio: 'pipe',
  })

  pythonProcess.on('error', (err) => {
    try {
      fs.writeFileSync(path.join(app.getPath('userData'), 'spawn_error.txt'), `Spawn error: ${err.message}\nStack: ${err.stack}\nbin: ${pythonBin}\ncwd: ${cwd}`);
    } catch (e) {
      // ignore
    }
  })

  pythonProcess.stdout.on('data', (data) => console.log('[Python]', data.toString().trim()))
  pythonProcess.stderr.on('data', (data) => console.error('[Python ERR]', data.toString().trim()))
  pythonProcess.on('close', (code) => console.log('[Python] 종료, exit code:', code))

  // 핑 테스트 구동 시작
  checkBackendHealth()
}

// ─── 백엔드 구동 여부 확인 (헬스 체크) ─────────────────────────────────────────────
function checkBackendHealth(attempts = 1) {
  const maxAttempts = 10
  const delay = 500
  const url = 'http://localhost:8765/health'

  console.log(`[Electron] Checking backend health... (Attempt ${attempts}/${maxAttempts})`)

  const req = http.get(url, (res) => {
    if (res.statusCode === 200) {
      console.log('[Electron] Backend health check passed. Creating window...')
      createWindow()
    } else {
      retryOrAbort()
    }
  })

  req.on('error', (err) => {
    retryOrAbort()
  })

  req.end()

  function retryOrAbort() {
    if (attempts < maxAttempts) {
      setTimeout(() => {
        checkBackendHealth(attempts + 1)
      }, delay)
    } else {
      console.error('[Electron] Backend health check failed after max attempts.')
      dialog.showErrorBox(
        '상담일지 백엔드 엔진 시작 실패',
        '상담 데이터 처리 엔진(FastAPI)을 백그라운드에 구동하지 못했습니다.\n\n' +
        '예상 원인 및 해결 방법:\n' +
        '1. 백신 프로그램(V3, 알약 등)에서 "backend.exe" 실행을 감지하여 차단했을 가능성이 높습니다. 백신의 실시간 감시 기능에서 탐지 제외(검사 예외) 설정을 추가해 주세요.\n' +
        '2. 다른 네트워크 포트(8765) 사용 프로그램과의 충돌로 인해 발생할 수 있습니다.\n' +
        '3. 지속적으로 실패할 경우, 프로그램을 재설치하거나 관리자에게 문의하십시오.'
      )
      killPythonProcess()
      app.quit()
    }
  }
}

// ─── 공통 파일 열기 다이얼로그 ─────────────────────────────────────────────
async function handleFileOpen(window) {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    title: '상담일지 엑셀 파일 열기',
    filters: [
      { name: 'Excel Files', extensions: ['xlsx'] }
    ],
    properties: ['openFile']
  })
  if (!canceled && filePaths.length > 0) {
    return filePaths[0]
  }
  return null
}

// ─── 한국어 메뉴 설정 ──────────────────────────────────────────────────────
function setCustomMenu(window) {
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '상담일지 열기...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const filePath = await handleFileOpen(window)
            if (filePath && window) {
              window.webContents.send('menu:file-opened', filePath)
            }
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          role: 'quit',
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { label: '실행 취소', role: 'undo' },
        { label: '다시 실행', role: 'redo' },
        { type: 'separator' },
        { label: '잘라내기', role: 'cut' },
        { label: '복사', role: 'copy' },
        { label: '붙여넣기', role: 'paste' },
        { label: '모두 선택', role: 'selectall' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { label: '새로고침', role: 'reload' },
        { label: '강제 새로고침', role: 'forcereload' },
        { label: '개발자 도구', role: 'toggledevtools' },
        { type: 'separator' },
        { label: '실제 크기', role: 'resetzoom' },
        { label: '확대', role: 'zoomin' },
        { label: '축소', role: 'zoomout' },
        { type: 'separator' },
        { label: '전체 화면', role: 'togglefullscreen' }
      ]
    },
    {
      label: '창',
      submenu: [
        { label: '최소화', role: 'minimize' },
        { label: '창 닫기', role: 'close' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '상담일지 정보',
          click: () => {
            dialog.showMessageBox(window, {
              type: 'info',
              title: '앱 정보',
              message: '상담일지 관리 시스템',
              detail: `버전(Version): ${app.getVersion()}\n플랫폼: ${process.platform}\n\nElectron + React + Python FastAPI 기반으로 구현된 초경량 상담 기록 도구입니다.`
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ─── 메인 윈도우 생성 ─────────────────────────────────────────────────────
function createWindow() {
  if (mainWindow) {
    mainWindow.focus()
    return
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f0f4f9',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // ready-to-show 이벤트 후 표시
  })

  // 개발: Vite 개발 서버 / 프로덕션: 빌드된 파일
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'))
  }

  // 준비되면 부드럽게 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    setCustomMenu(mainWindow)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── 앱 이벤트 ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  setupAutoUpdater()
  startPythonBackend() // 이 내부에서 성공 시 createWindow() 호출

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // 앱 실행 10초 뒤 백그라운드에서 조용히 업데이트 체크 (시작 성능 방해 차단)
  setTimeout(() => {
    if (app.isPackaged) {
      console.log('[Electron] Starting initial silent update check...')
      autoUpdater.checkForUpdates().catch(err => {
        console.error('[Updater] Startup check failed:', err)
      })
    }
  }, 10000)
})

function killPythonProcess() {
  if (pythonProcess) {
    console.log(`[Electron] Killing Python process tree (pid: ${pythonProcess.pid})...`)
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process')
        execSync(`taskkill /pid ${pythonProcess.pid} /T /F`)
      } catch (err) {
        console.error('[Electron] taskkill 실패 또는 이미 종료됨:', err.message)
      }
    } else {
      try {
        pythonProcess.kill()
      } catch (err) {
        console.error('[Electron] 프로세스 시그널 킬 실패:', err.message)
      }
    }
    pythonProcess = null
  }
}

app.on('before-quit', () => {
  killPythonProcess()
})

app.on('will-quit', () => {
  killPythonProcess()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    killPythonProcess()
    app.quit()
  }
})

app.on('quit', () => {
  killPythonProcess()
})

// ─── IPC 핸들러 (3단계에서 확장) ──────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:platform', () => process.platform)
ipcMain.handle('dialog:openFile', async () => {
  return await handleFileOpen(mainWindow)
})

// ─── 자동 업데이트 설정 및 IPC 바인딩 격리 ─────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.autoDownload = false // 자동 다운로드 비활성화

  // 기존 리스너가 있을 경우 초기화
  autoUpdater.removeAllListeners('update-available')
  autoUpdater.removeAllListeners('update-not-available')
  autoUpdater.removeAllListeners('download-progress')
  autoUpdater.removeAllListeners('update-downloaded')
  autoUpdater.removeAllListeners('error')

  // autoUpdater 이벤트 수신 및 Renderer 전송
  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:available', info)
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] Already up to date.')
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:not-available')
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    console.log('[Updater] Download progress percent:', progressObj.percent)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:progress', progressObj.percent)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded successfully.')
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:downloaded')
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('[Updater Error Event]', err)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:error', err ? err.message : '알 수 없는 업데이트 오류')
    }
  })
}

// IPC 1회성 핸들러 바인딩
ipcMain.on('updater:check', () => {
  console.log('[Updater] Manual update check initiated...')
  autoUpdater.checkForUpdates().catch(err => {
    console.error('[Updater Check Error]', err)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:error', err.message)
    }
  })
})

ipcMain.on('updater:download', () => {
  console.log('[Updater] Downloading update package...')
  autoUpdater.downloadUpdate().catch(err => {
    console.error('[Updater Download Error]', err)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:error', err.message)
    }
  })
})

ipcMain.on('updater:install', () => {
  console.log('[Updater] Quitting and installing update (cleaning up python process first)...')
  killPythonProcess()
  autoUpdater.quitAndInstall()
})

