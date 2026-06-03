import { RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Download, Power, Info } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function SystemSettingsTab() {
  const {
    appVersion,
    updateStatus,
    downloadPercent,
    newVersionInfo,
    updateErrorMessage,
    checkUpdatesManually,
    setBackupModalOpen,
    setUpdateStatus,
    autoStart,
    saveAutoStart,
    setChangelogOpen
  } = useAppStore()

  return (
    <div className="space-y-5">
      {/* 윈도우 설정 카드 */}
      <div 
        className="p-5 rounded-2xl border space-y-4 shadow-sm"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-start gap-3">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" 
              style={{ background: 'var(--border-light)' }}
            >
              <Power size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <span className="block font-bold text-neutral-800 dark:text-neutral-200 animate-fade-in" style={{ color: 'var(--text-primary)' }}>
                자동 시작 (Auto Start)
              </span>
              <span className="block text-[11px] text-neutral-400 mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Windows 로그인 후 상담일지 프로그램이 자동 실행됩니다.
              </span>
            </div>
          </div>
          <button
            onClick={() => saveAutoStart(!autoStart)}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            style={{
              backgroundColor: autoStart ? 'var(--accent)' : 'var(--border)'
            }}
          >
            <span
              className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              style={{
                transform: autoStart ? 'translateX(20px)' : 'translateX(0px)'
              }}
            />
          </button>
        </div>
      </div>

      {/* 버전 정보 카드 (앱 정보) */}
      <div 
        className="p-5 rounded-2xl border space-y-4 shadow-sm"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center gap-1.5 pb-2 text-xs" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <Info size={14} style={{ color: 'var(--text-secondary)' }} />
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>앱 정보</span>
        </div>

        <div className="flex justify-between items-center text-xs pt-1">
          <span className="font-semibold text-neutral-500 dark:text-neutral-400" style={{ color: 'var(--text-secondary)' }}>버전</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-700 dark:text-neutral-300" style={{ color: 'var(--text-primary)' }}>
              {appVersion ? appVersion.replace(/^v/, '') : '1.1.11'}
            </span>
            <button
              onClick={() => setChangelogOpen(true)}
              className="text-[11.5px] font-bold text-accent hover:underline cursor-pointer transition-all"
              style={{ color: 'var(--accent)' }}
            >
              변경 사항
            </button>
          </div>
        </div>

        {/* 업데이트 상태 표시 카드 */}
        <div 
          className="p-4 rounded-xl border flex flex-col gap-2.5 mt-2 text-xs" 
          style={{ 
            background: 'var(--bg-primary)', 
            borderColor: 'var(--border)' 
          }}
        >
          {updateStatus === 'idle' && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-500" style={{ color: 'var(--text-secondary)' }}>새 업데이트 확인</span>
              <button
                onClick={checkUpdatesManually}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border hover:bg-hover transition-all cursor-pointer text-neutral-700 dark:text-neutral-300"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
              >
                업데이트 확인
              </button>
            </div>
          )}

          {updateStatus === 'checking' && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-400 animate-pulse" style={{ color: 'var(--text-muted)' }}>업데이트 정보를 확인하는 중...</span>
              <RefreshCw size={13} className="animate-spin text-neutral-400" />
            </div>
          )}

          {updateStatus === 'not-available' && (
            <div className="flex justify-between items-center text-xs text-green-600 font-bold">
              <span>최신 버전을 사용 중입니다.</span>
              <CheckCircle2 size={15} />
            </div>
          )}

          {updateStatus === 'available' && (
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200" style={{ color: 'var(--text-primary)' }}>새로운 업데이트가 있습니다!</span>
                  <span className="block text-[10px] text-accent font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>새 버전: v{newVersionInfo?.version}</span>
                </div>
                <button
                  onClick={() => {
                    if (window.updaterAPI) {
                      setUpdateStatus('downloading')
                      window.updaterAPI.downloadUpdate()
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-accent text-white font-bold text-[11px] shadow-sm hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  다운로드 시작
                </button>
              </div>
            </div>
          )}

          {updateStatus === 'downloading' && (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold" style={{ color: 'var(--accent)' }}>
                <span>새 업데이트 다운로드 중...</span>
                <span>{downloadPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${downloadPercent}%`, backgroundColor: 'var(--accent)' }} />
              </div>
            </div>
          )}

          {updateStatus === 'downloaded' && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-600 font-bold animate-pulse">다운로드 완료! 앱 재시작이 필요합니다.</span>
              <button
                onClick={() => setBackupModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-green-500 text-white font-bold text-[11px] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                style={{ boxShadow: '0 2px 6px rgba(34,197,94,0.3)' }}
              >
                지금 재시작
              </button>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between items-center text-red-500 font-semibold">
                <span>업데이트 확인 오류</span>
                <button
                  onClick={checkUpdatesManually}
                  className="px-2 py-1 rounded border text-[10px] hover:bg-hover transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  다시 시도
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 block truncate" style={{ color: 'var(--text-muted)' }} title={updateErrorMessage}>
                {updateErrorMessage}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
