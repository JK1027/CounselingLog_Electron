const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

const isDev = process.env.NODE_ENV !== 'production'

let mainWindow = null
let pythonProcess = null

// ─── Python FastAPI 백엔드 시작 (3단계에서 활성화) ─────────────────────────
function startPythonBackend() {
  if (isDev) return // 3단계 전까지는 스킵

  const backendPath = path.join(__dirname, '../backend')
  pythonProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--port', '8765'], {
    cwd: backendPath,
    stdio: 'pipe',
  })

  pythonProcess.stdout.on('data', (data) => console.log('[Python]', data.toString()))
  pythonProcess.stderr.on('data', (data) => console.error('[Python ERR]', data.toString()))
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
    // Python 프로세스 정리
    if (pythonProcess) {
      pythonProcess.kill()
      pythonProcess = null
    }
    app.quit()
  }
})

// ─── IPC 핸들러 (3단계에서 확장) ──────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:platform', () => process.platform)
