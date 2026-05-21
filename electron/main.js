const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

const isDev = process.env.NODE_ENV !== 'production'

let mainWindow = null
let pythonProcess = null

const fs = require('fs')

// ─── Python FastAPI 백엔드 시작 ─────────────────────────────────────────────
function startPythonBackend() {
  const backendPath = path.join(__dirname, '../backend')
  const rootPath = path.join(__dirname, '..')
  
  // 가상환경 Python 경로 탐색
  const venvPythonPathWin = path.join(backendPath, 'venv/Scripts/python.exe')
  const venvPythonPathUnix = path.join(backendPath, 'venv/bin/python')
  let pythonBin = 'python'

  if (fs.existsSync(venvPythonPathWin)) {
    pythonBin = venvPythonPathWin
  } else if (fs.existsSync(venvPythonPathUnix)) {
    pythonBin = venvPythonPathUnix
  }

  console.log(`[Electron] Starting Python backend with ${pythonBin} at ${rootPath}...`)

  pythonProcess = spawn(pythonBin, ['-m', 'uvicorn', 'backend.main:app', '--port', '8765'], {
    cwd: rootPath,
    stdio: 'pipe',
  })

  pythonProcess.stdout.on('data', (data) => console.log('[Python]', data.toString().trim()))
  pythonProcess.stderr.on('data', (data) => console.error('[Python ERR]', data.toString().trim()))
  pythonProcess.on('close', (code) => console.log('[Python] 종료, exit code:', code))
}

// ─── 메인 윈도우 생성 ─────────────────────────────────────────────────────
function createWindow() {
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
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'))
  }

  // 준비되면 부드럽게 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── 앱 이벤트 ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startPythonBackend()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (pythonProcess) {
      pythonProcess.kill()
      pythonProcess = null
    }
    app.quit()
  }
})

app.on('quit', () => {
  if (pythonProcess) {
    pythonProcess.kill()
    pythonProcess = null
  }
})

// ─── IPC 핸들러 (3단계에서 확장) ──────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:platform', () => process.platform)
