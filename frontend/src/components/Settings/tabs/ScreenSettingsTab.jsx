import { useAppStore } from '@/store/useAppStore'

export default function ScreenSettingsTab() {
  const { isCompactMode, toggleCompactMode } = useAppStore()

  return (
    <div className="space-y-5">
      {/* 화면 및 레이아웃 설정 카드 */}
      <div 
        className="p-5 rounded-2xl border space-y-4 shadow-sm"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="block font-bold text-neutral-800 dark:text-neutral-200" style={{ color: 'var(--text-primary)' }}>
              압축 모드 (Compact Mode)
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{
                background: isCompactMode ? 'var(--accent-soft)' : 'var(--bg-primary)',
                color: isCompactMode ? 'var(--accent)' : 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}>
                {isCompactMode ? '압축 모드 적용 중' : '기본 모드'}
              </span>
            </span>
            <span className="block text-[11px] text-neutral-400 mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              타임라인과 사이드바의 크기를 25% 축소하여 한 화면에 더 많은 정보를 표시합니다.
            </span>
          </div>
          <button
            onClick={toggleCompactMode}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            style={{
              backgroundColor: isCompactMode ? 'var(--accent)' : 'var(--border)'
            }}
          >
            <span
              className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              style={{
                transform: isCompactMode ? 'translateX(20px)' : 'translateX(0px)'
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
