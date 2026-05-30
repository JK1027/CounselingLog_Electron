import { Sparkles, ArrowRight, X, Download } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function UpdateAvailableModal() {
  const {
    showUpdateAvailableModal,
    newVersionInfo,
    appVersion,
    dismissUpdateVersion,
    setUpdateStatus
  } = useAppStore()

  // 모달이 비활성화 상태이거나 새 버전 정보가 없으면 렌더링 안 함
  if (!showUpdateAvailableModal || !newVersionInfo) return null

  const currentVerStr = appVersion || 'v0.0.0'
  const newVerStr = `v${newVersionInfo.version}`

  // 릴리즈 노트 포맷터
  const formatReleaseNotes = (notes) => {
    if (!notes) return ''
    if (Array.isArray(notes)) {
      return notes.map(n => typeof n === 'string' ? n : (n.note || '')).join('\n')
    }
    if (typeof notes === 'string') {
      return notes
    }
    return String(notes)
  }

  // 업데이트 다운로드 시작
  const handleDownload = () => {
    dismissUpdateVersion(newVersionInfo.version) // 거절 내역에 기록(기본 알림 억제)
    if (window.updaterAPI) {
      setUpdateStatus('downloading')
      window.updaterAPI.downloadUpdate()
    }
  }

  // 업데이트 나중에 하기 (건너뛰기)
  const handleDecline = () => {
    dismissUpdateVersion(newVersionInfo.version)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleDecline() }}
    >
      <div
        className="relative w-[360px] rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        }}
      >
        {/* 상단 닫기 (우측 상단 X 버튼) */}
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 hover:bg-hover p-1 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>

        {/* 타이틀 및 아이콘 */}
        <div className="flex flex-col items-center gap-3 text-center pt-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'var(--accent-soft)' }}
          >
            <Sparkles size={28} className="text-accent" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
              새로운 업데이트 발견!
            </h2>
            <p className="text-[10px] font-semibold text-neutral-400" style={{ color: 'var(--text-muted)' }}>
              프로그램 기능 개선 및 안정성 패치 안내
            </p>
          </div>
        </div>

        {/* 버전 비교 카드 */}
        <div
          className="flex items-center justify-center gap-4 py-3 px-4 rounded-xl border text-xs font-bold"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="text-center">
            <span className="block text-[9px] text-neutral-400 font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>현재 버전</span>
            <span className="text-neutral-500" style={{ color: 'var(--text-secondary)' }}>{currentVerStr}</span>
          </div>
          <ArrowRight size={14} className="text-neutral-400 mt-3" />
          <div className="text-center">
            <span className="block text-[9px] text-accent font-medium mb-0.5" style={{ color: 'var(--accent)' }}>업데이트 버전</span>
            <span className="text-accent font-extrabold" style={{ color: 'var(--accent)' }}>{newVerStr}</span>
          </div>
        </div>

        {/* 릴리즈 노트 영역 */}
        {newVersionInfo.releaseNotes && (
          <div
            className="p-3 rounded-xl border text-[11px] leading-relaxed max-h-[140px] overflow-y-auto no-scrollbar"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-primary)',
            }}
          >
            <span className="block font-bold mb-1" style={{ color: 'var(--text-primary)' }}>이번 버전 업데이트 내용:</span>
            <pre
              className="font-sans whitespace-pre-wrap text-neutral-500 break-words leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {formatReleaseNotes(newVersionInfo.releaseNotes)}
            </pre>
          </div>
        )}

        {/* 안내 메시지 */}
        <p className="text-center text-[11px] leading-normal" style={{ color: 'var(--text-muted)' }}>
          지금 다운로드하여 업데이트를 적용하시겠습니까?<br />
          다운로드 중에도 정상적으로 업무를 보실 수 있습니다.
        </p>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2 mt-1">
          {/* 업데이트 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer hover:opacity-90"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 4px 12px rgba(75,142,241,0.3)',
            }}
          >
            <Download size={13} />
            업데이트 다운로드 시작
          </button>

          {/* 나중에 하기 버튼 */}
          <button
            onClick={handleDecline}
            className="w-full flex items-center justify-center py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)' }}
          >
            나중에 하기 (현재 버전 유지)
          </button>
        </div>
      </div>
    </div>
  )
}
