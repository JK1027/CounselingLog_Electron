import { useState } from 'react'
import { Shield, Download, ArrowRight, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

/**
 * 업데이트 설치 직전 데이터 백업 확인 모달
 * 상태 머신: 'idle' | 'backing' | 'done' | 'error'
 */
export default function PreUpdateBackupModal() {
  const {
    isBackupModalOpen,
    setBackupModalOpen,
    newVersionInfo,
    triggerBackup,
  } = useAppStore()

  const [phase, setPhase] = useState('idle') // 'idle' | 'backing' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // 모달이 닫혀 있으면 렌더링 안 함
  if (!isBackupModalOpen) return null

  const versionLabel = newVersionInfo?.version
    ? `v${newVersionInfo.version} 업데이트 전`
    : '업데이트 전'

  // 백업 후 업데이트
  const handleBackupAndUpdate = async () => {
    setPhase('backing')
    try {
      await triggerBackup()
      setPhase('done')
      // 1.2초 뒤 자동으로 설치 진행
      setTimeout(() => {
        setBackupModalOpen(false)
        setPhase('idle')
        if (window.updaterAPI) window.updaterAPI.quitAndInstall()
      }, 1200)
    } catch (e) {
      setErrorMsg(e?.message || '백업에 실패했습니다.')
      setPhase('error')
    }
  }

  // 백업 없이 바로 업데이트
  const handleSkipAndUpdate = () => {
    setBackupModalOpen(false)
    setPhase('idle')
    if (window.updaterAPI) window.updaterAPI.quitAndInstall()
  }

  // 모달 닫기 (취소)
  const handleClose = () => {
    if (phase === 'backing') return // 백업 진행 중에는 닫기 차단
    setBackupModalOpen(false)
    setPhase('idle')
    setErrorMsg('')
  }

  return (
    // 오버레이 배경
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* 모달 카드 */}
      <div
        className="relative w-[320px] rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        }}
      >
        {/* 아이콘 + 타이틀 */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: '#FFF8E1' }}
          >
            {phase === 'backing' && (
              <Loader size={28} className="animate-spin" style={{ color: '#F59E0B' }} />
            )}
            {phase === 'done' && (
              <CheckCircle size={28} style={{ color: '#10B981' }} />
            )}
            {phase === 'error' && (
              <AlertCircle size={28} style={{ color: 'var(--red)' }} />
            )}
            {phase === 'idle' && (
              <Shield size={28} style={{ color: '#F59E0B' }} />
            )}
          </div>

          <div>
            <h2 className="text-base font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {phase === 'done' ? '백업 완료!' : phase === 'error' ? '백업 실패' : '데이터 백업'}
            </h2>
            <p className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
              {versionLabel}
            </p>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="text-center text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {phase === 'idle' && (
            <>
              만일의 사태를 대비하여 데이터를 백업하시겠습니까?<br />
              백업 파일은 언제든 다시 불러올 수 있습니다.
            </>
          )}
          {phase === 'backing' && (
            <span className="animate-pulse" style={{ color: 'var(--accent)' }}>
              백업 파일을 생성하는 중입니다...
            </span>
          )}
          {phase === 'done' && (
            <span style={{ color: '#10B981' }}>
              백업이 완료되었습니다. 잠시 후 업데이트가 시작됩니다.
            </span>
          )}
          {phase === 'error' && (
            <span style={{ color: 'var(--red)' }}>
              {errorMsg}<br />
              백업 없이 업데이트를 진행하거나 다시 시도해 주세요.
            </span>
          )}
        </div>

        {/* 버튼 영역 */}
        {(phase === 'idle' || phase === 'error') && (
          <div className="flex flex-col gap-2">
            {/* 백업하기 버튼 */}
            <button
              onClick={handleBackupAndUpdate}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)' }}
            >
              <Download size={14} />
              {phase === 'error' ? '다시 시도' : '백업하기'}
            </button>

            {/* 백업 없이 업데이트 버튼 */}
            <button
              onClick={handleSkipAndUpdate}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer hover:opacity-90"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 4px 12px rgba(75,142,241,0.3)',
              }}
            >
              <ArrowRight size={14} />
              백업 없이 업데이트
            </button>
          </div>
        )}

        {/* 완료/진행 중엔 버튼 숨김 (자동 진행) */}
        {phase === 'done' && (
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-[1200ms]"
              style={{ width: '100%', background: '#10B981' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
