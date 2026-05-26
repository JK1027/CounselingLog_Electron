import { useState } from 'react'
import { X, Settings, FolderOpen, RefreshCw, CheckCircle2, AlertTriangle, Play } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function SettingsModal() {
  const {
    settingsOpen,
    setSettingsOpen,
    backupDir,
    saveBackupDir,
    testBackupPath,
    lastBackupTime,
    lastBackupStatus,
    triggerBackup
  } = useAppStore()

  const [testing, setTesting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  if (!settingsOpen) return null

  const handleSelectFolder = async () => {
    if (window.electronAPI && window.electronAPI.openDirectoryDialog) {
      const selectedPath = await window.electronAPI.openDirectoryDialog()
      if (selectedPath) {
        await saveBackupDir(selectedPath)
      }
    } else {
      useAppStore.getState().addToast('일렉트론 환경에서만 폴더 선택 기능이 제공됩니다.', 'error')
    }
  }

  const handleResetDefault = async () => {
    const confirmReset = window.confirm('백업 저장 위치를 기본 설정(내 문서/상담일지 백업 파일)으로 초기화하시겠습니까?')
    if (confirmReset) {
      await saveBackupDir('')
    }
  }

  const handleTestPath = async () => {
    setTesting(true)
    await testBackupPath(backupDir)
    setTesting(false)
  }

  const handleManualBackup = async () => {
    setBackingUp(true)
    await triggerBackup()
    setBackingUp(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all select-none"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4"
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

        {/* 바디 */}
        <div className="p-6 space-y-6 text-sm">
          {/* 설정 섹션: 백업 관리 */}
          <div className="space-y-4">
            <div className="border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400" style={{ color: 'var(--text-muted)' }}>데이터 관리 및 백업</h4>
            </div>

            {/* 설정 행: 백업 위치 선택 */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block font-bold text-neutral-800 dark:text-neutral-200" style={{ color: 'var(--text-primary)' }}>백업 파일 저장 위치</span>
                  <span className="block text-[11px] text-neutral-400 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    수동 및 자동 백업 파일이 저장될 로컬 컴퓨터 경로를 지정합니다.
                  </span>
                </div>
                {backupDir && (
                  <button
                    onClick={handleResetDefault}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg border hover:bg-hover transition-all cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    기본값 복원
                  </button>
                )}
              </div>

              {/* 경로 표시창 및 선택 버튼 */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={backupDir ? backupDir : '내 문서 > 상담일지 백업 파일 (기본 경로)'}
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border outline-none font-medium truncate bg-neutral-50/50 dark:bg-neutral-900/10"
                  style={{
                    borderColor: 'var(--border)',
                    color: backupDir ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                  title={backupDir || '기본 경로'}
                />
                <button
                  onClick={handleSelectFolder}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border hover:bg-hover transition-all cursor-pointer text-neutral-700 dark:text-neutral-300"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-primary)'
                  }}
                >
                  <FolderOpen size={13} className="text-accent" style={{ color: 'var(--accent)' }} />
                  폴더 선택
                </button>
              </div>
            </div>

            {/* 검증 및 수동 백업 툴바 */}
            <div className="flex gap-2 pt-2">
              <button
                disabled={testing || !backupDir}
                onClick={handleTestPath}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  (!backupDir || testing) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-hover cursor-pointer'
                }`}
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)'
                }}
              >
                {testing ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Play size={11} className="text-green-500" />
                )}
                경로 테스트
              </button>

              <button
                disabled={backingUp}
                onClick={handleManualBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border hover:bg-hover transition-all cursor-pointer"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)'
                }}
              >
                {backingUp ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Play size={11} className="text-accent" style={{ color: 'var(--accent)' }} />
                )}
                지금 즉시 백업 실행
              </button>
            </div>

            {/* 상태 요약 표시 카드 */}
            <div
              className="p-3.5 rounded-xl border flex items-center justify-between mt-3 text-xs"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-0.5">
                <span className="block font-semibold text-neutral-500 dark:text-neutral-400" style={{ color: 'var(--text-secondary)' }}>최근 백업 상태</span>
                <span className="block text-[11px] text-neutral-400" style={{ color: 'var(--text-muted)' }}>
                  {lastBackupTime ? `${lastBackupTime} 기준` : '최근 백업 이력이 존재하지 않습니다.'}
                </span>
              </div>
              <div>
                {lastBackupStatus === 'success' && (
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <CheckCircle2 size={14} />
                    <span>성공</span>
                  </div>
                )}
                {lastBackupStatus === 'failure' && (
                  <div className="flex items-center gap-1 text-red-500 font-bold">
                    <AlertTriangle size={14} />
                    <span>실패</span>
                  </div>
                )}
                {!lastBackupStatus && (
                  <span className="text-neutral-400 font-medium" style={{ color: 'var(--text-muted)' }}>대기 중</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div
          className="px-5 py-4 flex justify-end"
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
