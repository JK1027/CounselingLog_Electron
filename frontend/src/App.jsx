import './index.css'
import './App.css'
import Sidebar from '@/components/Sidebar/Sidebar'
import Timeline from '@/components/Timeline/Timeline'
import QuickEditor from '@/components/QuickEditor/QuickEditor'
import CommandPalette from '@/components/Search/CommandPalette'
import Dashboard from '@/components/Dashboard/Dashboard'
import ToastContainer from '@/components/ui/ToastContainer'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { FileSpreadsheet } from 'lucide-react'

export default function App() {
  const { selectedStudent, editorOpen, initialize, openFileByPath, addToast } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    initialize()

    // 일렉트론 상단 메뉴에서 파일 열기 이벤트 수신
    if (window.electronAPI && window.electronAPI.onFileOpened) {
      const unsubscribe = window.electronAPI.onFileOpened((filePath) => {
        if (filePath) {
          openFileByPath(filePath)
        }
      })
      return () => {
        unsubscribe()
      }
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
      className="flex h-screen w-screen overflow-hidden relative" 
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 사이드바: 학생 목록 */}
      <Sidebar />

      {/* 메인 영역 */}
      <div className="flex flex-1 min-w-0">
        {/* 타임라인 or 대시보드 */}
        {selectedStudent ? (
          <div className="flex-1 min-w-0">
            <Timeline />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <Dashboard />
          </div>
        )}

        {/* Quick Editor: 새 기록 / 수정 패널 */}
        {editorOpen && <QuickEditor />}
      </div>

      {/* Command Palette: 전역 오버레이 */}
      <CommandPalette />

      {/* Toast 알림 */}
      <ToastContainer />

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
