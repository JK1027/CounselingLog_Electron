import { useState } from 'react'
import { FolderOpen, RefreshCw, Play, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function DataSettingsTab() {
  const {
    backupDir,
    saveBackupDir,
    testBackupPath,
    lastBackupTime,
    lastBackupStatus,
    triggerBackup,
    addToast
  } = useAppStore()

  const [testing, setTesting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  const handleSelectFolder = async () => {
    if (window.electronAPI && window.electronAPI.openDirectoryDialog) {
      const selectedPath = await window.electronAPI.openDirectoryDialog()
      if (selectedPath) {
        await saveBackupDir(selectedPath)
      }
    } else {
      addToast('일렉트론 환경에서만 폴더 선택 기능이 제공됩니다.', 'error')
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
    <div className="space-y-5">
      {/* 백업 위치 설정 카드 */}
      <div 
        className="p-5 rounded-2xl border space-y-4 shadow-sm"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="block font-bold text-neutral-800 dark:text-neutral-200" style={{ color: 'var(--text-primary)' }}>백업 파일 저장 위치</span>
              <span className="block text-[11px] text-neutral-400 mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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

          <div className="flex gap-2 items-center pt-1">
            <input
              type="text"
              readOnly
              value={backupDir ? backupDir : '내 문서 > 상담일지 백업 파일 (기본 경로)'}
              className="flex-1 text-xs px-3 py-2.5 rounded-xl border outline-none font-medium truncate"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-primary)',
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

        {/* 경로 테스트 & 수동 백업 */}
        <div className="flex gap-2 pt-1 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
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
      </div>

      {/* 백업 상태 카드 */}
      <div 
        className="p-4 rounded-xl border flex items-center justify-between text-xs shadow-sm"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)'
        }}
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
  )
}
