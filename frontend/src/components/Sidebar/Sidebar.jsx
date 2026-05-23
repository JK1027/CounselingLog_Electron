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
  } = useAppStore()

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

  const students = getFilteredStudents()

  // 전체 학생 목록으로부터 존재하는 모든 학년과 반 목록을 추출
  const availableGrades = Array.from(
    new Set(allStudents.map(s => s.grade).filter(Boolean))
  ).sort()

  const availableBans = Array.from(
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

  const urgentStudents = students.filter(s =>
    s.tags?.some(t => ['자해 및 자살', '학교폭력 피해', '학교폭력 가해'].includes(t))
  )
  const regularStudents = students.filter(s => !urgentStudents.includes(s))

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
                  className="p-0.5 rounded hover:bg-hover transition-colors inline-flex items-center justify-center cursor-pointer ml-1"
                >
                  <Home size={11} style={{ color: 'var(--accent)' }} />
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

      {/* 하단 통계 */}
      <div className={`px-4 ${isCompactMode ? 'py-2' : 'py-3'}`} style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>
            {students.length === allStudents.length ? `총 ${allStudents.length}명` : `필터 ${students.length}명 / 총 ${allStudents.length}명`}
          </span>
          <span>오늘 상담 {useAppStore.getState().todayStats?.total || 0}건</span>
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
        compact ? 'gap-2 px-2.5 py-1 my-0.5 mx-1' : 'gap-3 px-3 py-2.5 mx-1'
      }`}
      style={{
        width: 'calc(100% - 8px)',
        background: selected ? 'var(--accent-soft)' : 'transparent',
        color: selected ? 'var(--accent-dark)' : 'var(--text-primary)',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <Avatar name={student.name} size={compact ? "xs" : "sm"} selected={selected} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium truncate`} style={{
            color: selected ? 'var(--accent-dark)' : 'var(--text-primary)'
          }}>
            {student.name}
          </span>
          {urgent && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--red)' }} />}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px]" style={{ color: selected ? 'var(--accent)' : 'var(--text-muted)' }}>
            {student.grade}학년 · {student.sessionCount}회기 {student.ban && `· ${student.ban}반`}
          </span>
        </div>
      </div>
      <ChevronRight size={compact ? 11 : 13} style={{ color: 'var(--text-muted)' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
