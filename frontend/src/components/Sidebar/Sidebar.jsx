import { Search, Users, ChevronRight, AlertCircle, BookOpen } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar, TagBadge } from '@/components/ui/shared'

export default function Sidebar() {
  const {
    selectedStudent, setSelectedStudent,
    setCommandOpen, getFilteredStudents,
  } = useAppStore()

  const students = getFilteredStudents()

  const urgentStudents = students.filter(s =>
    s.tags?.some(t => ['자해 및 자살', '학교폭력 피해', '학교폭력 가해'].includes(t))
  )
  const regularStudents = students.filter(s => !urgentStudents.includes(s))

  return (
    <aside
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        boxShadow: '1px 0 0 var(--border-light)',
      }}
      className="flex flex-col h-full w-64 shrink-0"
    >
      {/* 상단 타이틀 */}
      <div className="px-4 pt-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-soft)' }}>
            <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>상담일지</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>2026학년도</p>
          </div>
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={() => setCommandOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150 text-left"
          style={{
            background: 'var(--bg-hover)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <Search size={13} />
          <span className="flex-1">학생 검색...</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            ⌘K
          </kbd>
        </button>
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
              <StudentItem key={s.id} student={s} selected={selectedStudent?.id === s.id} onClick={() => setSelectedStudent(s)} urgent />
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
            <StudentItem key={s.id} student={s} selected={selectedStudent?.id === s.id} onClick={() => setSelectedStudent(s)} />
          ))}
        </div>
      </nav>

      {/* 하단 통계 */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>총 {students.length}명</span>
          <span>오늘 상담 6건</span>
        </div>
      </div>
    </aside>
  )
}

function StudentItem({ student, selected, onClick, urgent }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 mx-1 text-left transition-all duration-150 group relative rounded-xl"
      style={{
        width: 'calc(100% - 8px)',
        background: selected ? 'var(--accent-soft)' : 'transparent',
        color: selected ? 'var(--accent-dark)' : 'var(--text-primary)',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <Avatar name={student.name} size="sm" selected={selected} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate" style={{
            color: selected ? 'var(--accent-dark)' : 'var(--text-primary)'
          }}>
            {student.name}
          </span>
          {urgent && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--red)' }} />}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs" style={{ color: selected ? 'var(--accent)' : 'var(--text-muted)' }}>
            {student.grade}학년 · {student.sessionCount}회기
          </span>
        </div>
      </div>
      <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
