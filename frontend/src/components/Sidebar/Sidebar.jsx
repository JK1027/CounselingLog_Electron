import { useMemo, useState, useEffect } from 'react'
import { Search, Users, ChevronRight, AlertCircle, BookOpen, FolderOpen, Maximize2, Minimize2, UserPlus, Home } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar, TagBadge } from '@/components/ui/shared'

export default function Sidebar({ width }) {
  const {
    selectedStudent, setSelectedStudent,
    setCommandOpen, getFilteredStudents,
    currentFilePath, openFileByPath,
    selectedGradeFilter, selectedBanFilter,
    setGradeFilter, setBanFilter,
    students: allStudents,
    isCompactMode, toggleCompactMode,
    setRegisterOpen,
    searchQuery,
  } = useAppStore()

  // 자동 업데이트를 위한 상태 머신
  const [appVersion, setAppVersion] = useState('v0.1.0')
  const [updateStatus, setUpdateStatus] = useState('idle') // 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [newVersionInfo, setNewVersionInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // 1. 현재 앱 버전 조회
    if (window.electronAPI && window.electronAPI.getVersion) {
      window.electronAPI.getVersion().then(v => setAppVersion(`v${v}`))
    }

    // 2. 일렉트론 메인 프로세스 업데이트 이벤트 구독
    if (window.updaterAPI) {
      const unsubAvailable = window.updaterAPI.onUpdateAvailable((info) => {
        setNewVersionInfo(info)
        setUpdateStatus('available')
      })
      const unsubNotAvailable = window.updaterAPI.onUpdateNotAvailable(() => {
        setUpdateStatus('not-available')
        setTimeout(() => setUpdateStatus('idle'), 3000)
      })
      const unsubProgress = window.updaterAPI.onDownloadProgress((percent) => {
        setDownloadPercent(Math.round(percent))
        setUpdateStatus('downloading')
      })
      const unsubDownloaded = window.updaterAPI.onUpdateDownloaded(() => {
        setUpdateStatus('downloaded')
      })
      const unsubError = window.updaterAPI.onUpdateError((err) => {
        console.error('Update error:', err)
        setErrorMessage(err || '업데이트 오류')
        setUpdateStatus('error')
        setTimeout(() => setUpdateStatus('idle'), 5000)
      })

      return () => {
        unsubAvailable()
        unsubNotAvailable()
        unsubProgress()
        unsubDownloaded()
        unsubError()
      }
    }
  }, [])

  const handleCheckUpdate = () => {
    if (window.updaterAPI) {
      setUpdateStatus('checking')
      window.updaterAPI.checkForUpdates()
    }
  }

  const handleDownload = () => {
    if (window.updaterAPI) {
      window.updaterAPI.downloadUpdate()
    }
  }

  const handleRestart = () => {
    if (window.updaterAPI) {
      window.updaterAPI.quitAndInstall()
    }
  }

  const handleOpenFile = async () => {
    if (window.electronAPI && window.electronAPI.openFileDialog) {
      const filePath = await window.electronAPI.openFileDialog()
      if (filePath) {
        await openFileByPath(filePath)
      }
    } else {
      useAppStore.getState().addToast('일렉트론 환경에서만 지원되는 기능입니다.', 'error')
    }
  }

  // 필터 및 검색 연산 useMemo 캐싱 적용
  const students = useMemo(() => {
    return getFilteredStudents()
  }, [allStudents, searchQuery, selectedGradeFilter, selectedBanFilter, getFilteredStudents])

  // 전체 학생 목록으로부터 존재하는 모든 학년과 반 목록을 추출
  const availableGrades = useMemo(() => {
    return Array.from(
      new Set(allStudents.map(s => s.grade).filter(Boolean))
    ).sort()
  }, [allStudents])

  const availableBans = useMemo(() => {
    return Array.from(
      new Set(
        allStudents
          .filter(s => !selectedGradeFilter || s.grade === selectedGradeFilter)
          .map(s => s.ban)
          .filter(Boolean)
      )
    ).sort((a, b) => {
      const na = parseInt(a, 10)
      const nb = parseInt(b, 10)
      if (isNaN(na) || isNaN(nb)) return a.localeCompare(b)
      return na - nb
    })
  }, [allStudents, selectedGradeFilter])

  const urgentStudents = useMemo(() => {
    return students.filter(s =>
      s.tags?.some(t => ['자해 및 자살', '학교폭력 피해', '학교폭력 가해'].includes(t))
    )
  }, [students])

  const regularStudents = useMemo(() => {
    return students.filter(s => !urgentStudents.includes(s))
  }, [students, urgentStudents])

  return (
    <aside
      style={{
        width: width ? `${width}px` : undefined,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        boxShadow: '1px 0 0 var(--border-light)',
      }}
      className={`flex flex-col h-full shrink-0 ${width ? '' : (isCompactMode ? 'transition-all duration-200 w-56' : 'transition-all duration-200 w-64')}`}
    >
      {/* 상단 타이틀 */}
      <div className={`px-4 ${isCompactMode ? 'pt-3 pb-2' : 'pt-5 pb-3'}`} style={{ borderBottom: '1px solid var(--border)' }}>
        <div className={`flex items-center justify-between ${isCompactMode ? 'mb-2' : 'mb-4'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`${isCompactMode ? 'w-6 h-6 rounded-lg' : 'w-8 h-8 rounded-xl'} flex items-center justify-center`}
              style={{ background: 'var(--accent-soft)' }}>
              <BookOpen size={isCompactMode ? 13 : 16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className={`${isCompactMode ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: 'var(--text-primary)' }}>상담일지</h1>
              <div className="flex items-center gap-1 mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span className="truncate max-w-[110px] font-medium" title={currentFilePath}>
                  {currentFilePath ? currentFilePath.split(/[\\/]/).pop() : '상담일지.xlsx'}
                </span>
                <button
                  onClick={handleOpenFile}
                  title="상담일지 파일 열기"
                  className="p-0.5 rounded hover:bg-hover transition-colors inline-flex items-center justify-center cursor-pointer"
                >
                  <FolderOpen size={11} style={{ color: 'var(--accent)' }} />
                </button>
                <button
                  onClick={toggleCompactMode}
                  title={isCompactMode ? "기본 모드로 전환" : "압축 모드로 전환"}
                  className="p-0.5 rounded hover:bg-hover transition-colors inline-flex items-center justify-center cursor-pointer ml-0.5"
                >
                  {isCompactMode ? (
                    <Minimize2 size={11} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Maximize2 size={11} style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  title="홈 화면(대시보드)으로 이동"
                  className="p-1 rounded hover:bg-hover transition-colors inline-flex items-center justify-center cursor-pointer ml-1.5"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-primary)' }}
                >
                  <Home size={13} style={{ color: 'var(--accent)' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={() => setCommandOpen(true)}
          className={`w-full flex items-center gap-2 rounded-xl text-sm transition-all duration-150 text-left ${
            isCompactMode ? 'px-2.5 py-1 text-xs' : 'px-3 py-2'
          }`}
          style={{
            background: 'var(--bg-hover)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <Search size={isCompactMode ? 11 : 13} />
          <span className="flex-1">학생 검색...</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            ⌘K
          </kbd>
        </button>

        {/* 신규 학생 상담 등록 버튼 */}
        <button
          onClick={() => setRegisterOpen(true)}
          className={`w-full flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-150 mt-2 cursor-pointer ${
            isCompactMode ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5'
          }`}
          style={{
            background: 'var(--accent)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(75,142,241,0.35)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <UserPlus size={isCompactMode ? 12 : 14} />
          신규 학생 상담 등록
        </button>

        {/* 학급 필터 */}
        <div className="flex gap-2 mt-2 px-0.5">
          <div className="flex-1 min-w-0">
            <select
              value={selectedGradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className={`w-full rounded-lg outline-none transition-all cursor-pointer ${
                isCompactMode ? 'text-[11px] px-1.5 py-1' : 'text-xs px-2 py-1.5'
              }`}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">학년 전체</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}학년</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <select
              value={selectedBanFilter}
              onChange={e => setBanFilter(e.target.value)}
              className={`w-full rounded-lg outline-none transition-all cursor-pointer ${
                isCompactMode ? 'text-[11px] px-1.5 py-1' : 'text-xs px-2 py-1.5'
              }`}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">반 전체</option>
              {availableBans.map(b => (
                <option key={b} value={b}>{b}반</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 학생 목록 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {urgentStudents.length > 0 && (
          <div className="mb-1">
            <div className="px-4 py-1.5 flex items-center gap-1.5">
              <AlertCircle size={11} style={{ color: 'var(--red)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--red)' }}>
                주의 필요
              </span>
            </div>
            {urgentStudents.map(s => (
              <StudentItem key={s.id} student={s} selected={selectedStudent?.id === s.id} onClick={() => setSelectedStudent(s)} urgent compact={isCompactMode} />
            ))}
          </div>
        )}

        <div>
          <div className="px-4 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              전체 학생 ({students.length})
            </span>
          </div>
          {regularStudents.map(s => (
            <StudentItem key={s.id} student={s} selected={selectedStudent?.id === s.id} onClick={() => setSelectedStudent(s)} compact={isCompactMode} />
          ))}
        </div>
      </nav>

      {/* 하단 통계 및 업데이트 */}
      <div className={`px-4 ${isCompactMode ? 'py-2 space-y-1' : 'py-3 space-y-2'}`} style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>
            {students.length === allStudents.length ? `총 ${allStudents.length}명` : `필터 ${students.length}명 / 총 ${allStudents.length}명`}
          </span>
          <span>오늘 상담 {useAppStore.getState().todayStats?.total || 0}건</span>
        </div>

        {/* 자동 업데이트 UI */}
        <div className="text-[11px] pt-1.5 border-t border-dashed select-none print-exclude" style={{ borderColor: 'var(--border)' }}>
          {updateStatus === 'idle' && (
            <div className="flex justify-between items-center" style={{ color: 'var(--text-muted)' }}>
              <span>버전: {appVersion}</span>
              {window.updaterAPI && (
                <button
                  onClick={handleCheckUpdate}
                  className="text-[10px] font-bold text-accent hover:text-accent-dark transition-colors cursor-pointer"
                >
                  업데이트 확인
                </button>
              )}
            </div>
          )}

          {updateStatus === 'checking' && (
            <div className="text-neutral-400 animate-pulse text-center">
              업데이트 확인 중...
            </div>
          )}

          {updateStatus === 'not-available' && (
            <div className="text-green-600 font-semibold text-center">
              최신 버전을 사용 중입니다.
            </div>
          )}

          {updateStatus === 'available' && (
            <div className="flex justify-between items-center">
              <span className="text-accent-dark font-semibold">새 버전 발견! ({newVersionInfo?.version})</span>
              <button
                onClick={handleDownload}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                다운로드
              </button>
            </div>
          )}

          {updateStatus === 'downloading' && (
            <div className="space-y-1">
              <div className="flex justify-between text-blue-500 font-medium">
                <span>새 업데이트 다운로드 중...</span>
                <span>{downloadPercent}%</span>
              </div>
              <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${downloadPercent}%` }}
                />
              </div>
            </div>
          )}

          {updateStatus === 'downloaded' && (
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-semibold animate-pulse">다운로드 완료!</span>
              <button
                onClick={handleRestart}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500 text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                지금 재시작
              </button>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="text-red-500 font-semibold text-center truncate" title={errorMessage}>
              오류: {errorMessage}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function StudentItem({ student, selected, onClick, urgent, compact }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center transition-all duration-150 group relative rounded-xl ${
        compact ? 'gap-2 px-2.5 py-1.5 my-0.5 mx-1' : 'gap-3 px-3 py-3 mx-1'
      }`}
      style={{
        width: 'calc(100% - 8px)',
        background: selected ? 'var(--bg-selected)' : 'transparent',
        color: selected ? 'var(--accent-dark)' : 'var(--text-primary)',
        paddingLeft: selected ? (compact ? '12px' : '16px') : undefined,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      {selected && (
        <div 
          className="absolute left-0 top-[15%] bottom-[15%] w-1 rounded-r-full" 
          style={{ backgroundColor: 'var(--accent)' }} 
        />
      )}
      <Avatar name={student.name} size={compact ? "xs" : "sm"} selected={selected} />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold truncate`} style={{
            color: selected ? 'var(--accent-dark)' : 'var(--text-primary)'
          }}>
            {student.name}
          </span>
          {urgent && <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: 'var(--red)' }} />}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px]" style={{ color: selected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
            {student.grade}학년{student.ban && ` · ${student.ban}반`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span 
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all"
          style={{
            background: selected ? 'var(--accent)' : 'var(--bg-hover)',
            color: selected ? '#ffffff' : 'var(--text-secondary)',
          }}
        >
          {student.sessionCount}회기
        </span>
        <ChevronRight size={compact ? 11 : 13} style={{ color: 'var(--text-muted)' }} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </button>
  )
}


