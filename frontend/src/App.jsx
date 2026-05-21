import './index.css'
import './App.css'
import Sidebar from '@/components/Sidebar/Sidebar'
import Timeline from '@/components/Timeline/Timeline'
import QuickEditor from '@/components/QuickEditor/QuickEditor'
import CommandPalette from '@/components/Search/CommandPalette'
import Dashboard from '@/components/Dashboard/Dashboard'
import ToastContainer from '@/components/ui/ToastContainer'
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export default function App() {
  const { selectedStudent, editorOpen, initialize } = useAppStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
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
    </div>
  )
}
