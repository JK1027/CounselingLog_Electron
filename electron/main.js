const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

const isDev = !app.isPackaged

let mainWindow = null
let pythonProcess = null

const fs = require('fs')

// ─── Python FastAPI 백엔드 시작 ─────────────────────────────────────────────
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
  startPythonBackend()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function killPythonProcess() {
  if (pythonProcess) {
    console.log(`[Electron] Killing Python process tree (pid: ${pythonProcess.pid})...`)
    if (process.platform === 'win32') {
      const { exec } = require('child_process')
      exec(`taskkill /pid ${pythonProcess.pid} /T /F`, (err) => {
        if (err) console.error('[Electron] taskkill 실패:', err)
      })
    } else {
      pythonProcess.kill()
    }
    pythonProcess = null
  }
}

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
