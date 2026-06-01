import { useState } from 'react'
import { X, Settings, Database, Monitor } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import DataSettingsTab from './tabs/DataSettingsTab'
import ScreenSettingsTab from './tabs/ScreenSettingsTab'
import SystemSettingsTab from './tabs/SystemSettingsTab'

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useAppStore()

  // 탭 상태 영속성 관리 (기본값 'data')
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('counseling_active_setting_tab')
    if (saved === 'data' || saved === 'screen' || saved === 'system') {
      return saved
    }
    return 'data'
  })

  if (!settingsOpen) return null

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    localStorage.setItem('counseling_active_setting_tab', tab)
  }

  const tabs = [
    { id: 'data', label: '데이터 관리', icon: Database },
    { id: 'screen', label: '화면 설정', icon: Monitor },
    { id: 'system', label: '시스템 및 정보', icon: Settings },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all select-none flex flex-col"
        style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)',
          maxHeight: '80vh' // 해상도 안전 한계치 가이드 적용
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 (고정) */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-neutral-100 dark:bg-neutral-800" style={{ border: '1px solid var(--border)' }}>
              <Settings size={16} className="text-accent" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200" style={{ color: 'var(--text-primary)' }}>설정</h3>
          </div>
          <button onClick={() => setSettingsOpen(false)} className="hover:bg-hover p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* 탭 네비게이션바 (고정) */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex p-1 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40" style={{ border: '1px solid var(--border-light)' }}>
            {tabs.map(tab => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  style={{
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 2px 6px rgba(75,142,241,0.2)' : 'none'
                  }}
                >
                  <TabIcon size={12} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 본문 콘텐츠 영역 (본문만 세로 스크롤) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[300px] max-h-[50vh]">
          {activeTab === 'data' && <DataSettingsTab />}
          {activeTab === 'screen' && <ScreenSettingsTab />}
          {activeTab === 'system' && <SystemSettingsTab />}
        </div>

        {/* 푸터 (고정) */}
        <div
          className="px-5 py-4 flex justify-end shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
