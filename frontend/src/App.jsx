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
import PreUpdateBackupModal from '@/components/ui/PreUpdateBackupModal'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { FileSpreadsheet } from 'lucide-react'
import { useLayoutResize } from '@/hooks/useLayoutResize'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'

export default function App() {
  const { 
    selectedStudent, 
    editorOpen, 
    openFileByPath, 
    addToast,
    initializeUpdater,
    updateStatus,
    downloadPercent,
    setBackupModalOpen
  } = useAppStore()

  const [dragCounter, setDragCounter] = useState(0)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printSetupData, setPrintSetupData] = useState(null)
  
  // 리팩토링: 마우스 레이아웃 조절 및 전역 단축키를 커스텀 훅으로 격리
  const { sidebarWidth, editorWidth, resizing, setResizing } = useLayoutResize()
  useGlobalShortcuts()

  // 1. 업데이트 이벤트 구독 초기화
  useEffect(() => {
    const unsub = initializeUpdater()
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [initializeUpdater])

  // 2. 윈도우 레벨에서 파일 드래그가 감입될 때만 오버레이 활성화 (Drag Counter 방식)
  useEffect(() => {
    const handleWindowDragEnter = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setDragCounter(prev => prev + 1)
      }
    }

    const handleWindowDragLeave = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setDragCounter(prev => Math.max(0, prev - 1))
      }
    }

    const handleWindowDrop = () => {
      setDragCounter(0)
    }

    window.addEventListener('dragenter', handleWindowDragEnter)
    window.addEventListener('dragleave', handleWindowDragLeave)
    window.addEventListener('drop', handleWindowDrop)
    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter)
      window.removeEventListener('dragleave', handleWindowDragLeave)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [])

  const isDragging = dragCounter > 0

  // 드래그 앤 드롭 오버레이 내부 이벤트 핸들러
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(0) // 강제 리셋

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
      className={`flex h-screen w-screen overflow-hidden relative ${resizing ? 'select-none cursor-col-resize' : ''}`} 
      style={{ background: 'var(--bg-primary)', paddingTop: updateStatus === 'downloaded' ? '36px' : '0px', transition: 'padding-top 0.2s ease' }}
    >
      {/* 최상단 업데이트 알림 배너 */}
      {updateStatus === 'downloaded' && (
        <div className="absolute top-0 left-0 right-0 h-[36px] z-50 flex items-center justify-between px-5 text-white text-[11px] font-medium shadow-sm print-exclude" style={{ backgroundColor: 'var(--accent)' }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>새로운 업데이트 설치 준비가 완료되었습니다. 변경 사항을 적용하려면 앱을 다시 시작해 주세요.</span>
          </div>
          <button 
            onClick={() => setBackupModalOpen(true)}
            className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold hover:bg-neutral-100 transition-all cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            재시작 및 설치
          </button>
        </div>
      )}

      {/* 업데이트 전 데이터 백업 확인 모달 */}
      <PreUpdateBackupModal />

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
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-200 pointer-events-auto"
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

