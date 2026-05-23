import './index.css'
import './App.css'
import Sidebar from '@/components/Sidebar/Sidebar'
import Timeline from '@/components/Timeline/Timeline'
import QuickEditor from '@/components/QuickEditor/QuickEditor'
import CommandPalette from '@/components/Search/CommandPalette'
import Dashboard from '@/components/Dashboard/Dashboard'
import ToastContainer from '@/components/ui/ToastContainer'
import PrintSetupModal from '@/components/Print/PrintSetupModal'
import PrintPreview from '@/components/Print/PrintPreview'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { FileSpreadsheet } from 'lucide-react'

export default function App() {
  const { selectedStudent, editorOpen, initialize, openFileByPath, addToast } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printSetupData, setPrintSetupData] = useState(null)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('counseling_sidebar_width')
    return saved ? parseInt(saved, 10) : 260
  })
  const [editorWidth, setEditorWidth] = useState(() => {
    const saved = localStorage.getItem('counseling_editor_width')
    return saved ? parseInt(saved, 10) : 320
  })
  const [resizing, setResizing] = useState(null) // 'sidebar' | 'editor' | null

  // 마우스 드래그를 이용한 레이아웃 크기 조절 이벤트 바인딩
  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e) => {
      if (resizing === 'sidebar') {
        const newWidth = Math.max(200, Math.min(400, e.clientX))
        setSidebarWidth(newWidth)
      } else if (resizing === 'editor') {
        const newWidth = Math.max(280, Math.min(500, window.innerWidth - e.clientX))
        setEditorWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (resizing === 'sidebar') {
        localStorage.setItem('counseling_sidebar_width', String(sidebarWidth))
      } else if (resizing === 'editor') {
        localStorage.setItem('counseling_editor_width', String(editorWidth))
      }
      setResizing(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing, sidebarWidth, editorWidth])

  useEffect(() => {
    initialize()

    // 일렉트론 상단 메뉴에서 파일 열기 이벤트 수신
    let unsubscribe = null
    if (window.electronAPI && window.electronAPI.onFileOpened) {
      unsubscribe = window.electronAPI.onFileOpened((filePath) => {
        if (filePath) {
          openFileByPath(filePath)
        }
      })
    }

    // 전역 키보드 단축키 바인딩
    const handleKeyDown = (e) => {
      // 1. Ctrl + N: 새 상담 (selectedStudent가 있을 때)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        const store = useAppStore.getState()
        if (store.selectedStudent) {
          store.setEditorMode('new')
          store.setEditorOpen(true)
        } else {
          store.addToast('상담을 입력할 학생을 먼저 선택해 주세요.', 'error')
        }
      }

      // 2. Alt + ArrowUp: 이전 학생 선택
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        const store = useAppStore.getState()
        const filtered = store.getFilteredStudents()
        if (filtered.length > 0) {
          const currentIndex = filtered.findIndex(s => s.id === store.selectedStudent?.id)
          if (currentIndex > 0) {
            store.setSelectedStudent(filtered[currentIndex - 1])
          }
        }
      }

      // 3. Alt + ArrowDown: 다음 학생 선택
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault()
        const store = useAppStore.getState()
        const filtered = store.getFilteredStudents()
        if (filtered.length > 0) {
          const currentIndex = filtered.findIndex(s => s.id === store.selectedStudent?.id)
          if (currentIndex >= 0 && currentIndex < filtered.length - 1) {
            store.setSelectedStudent(filtered[currentIndex + 1])
          } else if (currentIndex === -1) {
            store.setSelectedStudent(filtered[0])
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (unsubscribe) unsubscribe()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // 버블링으로 인한 오프 방지
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const path = file.path
      
      if (path) {
        if (path.toLowerCase().endsWith('.xlsx')) {
          await openFileByPath(path)
        } else {
          addToast('엑셀 파일(.xlsx)만 드롭하여 열 수 있습니다.', 'error')
        }
      } else {
        addToast('파일 경로를 읽을 수 없습니다.', 'error')
      }
    }
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex h-screen w-screen overflow-hidden relative ${resizing ? 'select-none cursor-col-resize' : ''}`} 
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 사이드바: 학생 목록 */}
      <Sidebar width={sidebarWidth} />

      {/* 사이드바 크기 조절 핸들 */}
      <div
        onMouseDown={(e) => { e.preventDefault(); setResizing('sidebar') }}
        className="w-1 hover:w-1.5 cursor-col-resize transition-all z-20 shrink-0 select-none"
        style={{
          background: resizing === 'sidebar' ? 'var(--accent)' : 'var(--border)',
          boxShadow: resizing === 'sidebar' ? '0 0 8px var(--accent)' : 'none'
        }}
      />

      {/* 메인 영역 */}
      <div className="flex flex-1 min-w-0">
        {/* 타임라인 or 대시보드 */}
        {selectedStudent ? (
          <div className="flex-1 min-w-0">
            <Timeline onOpenPrintModal={() => setIsPrintModalOpen(true)} />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <Dashboard onOpenPrintModal={() => setIsPrintModalOpen(true)} />
          </div>
        )}

        {/* 에디터 크기 조절 핸들 */}
        {editorOpen && (
          <div
            onMouseDown={(e) => { e.preventDefault(); setResizing('editor') }}
            className="w-1 hover:w-1.5 cursor-col-resize transition-all z-20 shrink-0 select-none"
            style={{
              background: resizing === 'editor' ? 'var(--accent)' : 'var(--border)',
              boxShadow: resizing === 'editor' ? '0 0 8px var(--accent)' : 'none'
            }}
          />
        )}

        {/* Quick Editor: 새 기록 / 수정 패널 */}
        {editorOpen && <QuickEditor width={editorWidth} />}
      </div>

      {/* Command Palette: 전역 오버레이 */}
      <CommandPalette />

      {/* Toast 알림 */}
      <ToastContainer />

      {/* 인쇄 설정 모달 */}
      <PrintSetupModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onPreview={(data) => {
          setIsPrintModalOpen(false)
          setPrintSetupData(data)
        }} 
      />

      {/* 인쇄 미리보기 화면 */}
      {printSetupData && (
        <PrintPreview 
          setupData={printSetupData} 
          onClose={() => setPrintSetupData(null)} 
        />
      )}

      {/* 드래그앤드롭 오버레이 */}
      {isDragging && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none transition-all duration-200"
          style={{ 
            background: 'rgba(240, 244, 249, 0.92)', 
            backdropFilter: 'blur(10px)' 
          }}
        >
          <div 
            className="flex flex-col items-center justify-center p-12 rounded-3xl border-3 border-dashed max-w-md text-center"
            style={{ 
              borderColor: 'var(--accent)', 
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--accent-glow)' }}
            >
              <FileSpreadsheet size={32} className="text-accent" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>상담일지 파일 가져오기</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              여기에 엑셀 파일(.xlsx)을 놓으면<br />상담일지 데이터를 즉시 불러옵니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
