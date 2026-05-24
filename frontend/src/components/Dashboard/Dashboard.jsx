import { useState, useEffect } from 'react'
import { 
  BarChart2, Clock, AlertTriangle, BookOpen, Archive, Printer,
  User, Users, HeartHandshake, GraduationCap, Send, X, ExternalLink, Edit2, Loader, Calendar
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar, formatDate, SaveStateIndicator } from '@/components/ui/shared'

const FILTER_TYPES = [
  { id: '개인상담', label: '개인상담', icon: User, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', glow: 'rgba(59, 130, 246, 0.15)' },
  { id: '집단상담', label: '집단상담', icon: Users, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.2)', glow: 'rgba(99, 102, 241, 0.15)' },
  { id: '보호자상담', label: '보호자상담', icon: HeartHandshake, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', glow: 'rgba(16, 185, 129, 0.15)' },
  { id: '교원자문', label: '교원자문', icon: GraduationCap, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)', glow: 'rgba(139, 92, 246, 0.15)' },
  { id: '의뢰', label: '의뢰', icon: Send, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.2)', glow: 'rgba(236, 72, 153, 0.15)' }
]

export default function Dashboard({ onOpenPrintModal }) {
  const { students, todayStats, setSelectedStudent, setEditorOpen, setEditorMode, setSelectedSession, addToast } = useAppStore()
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(null)
  const [typeSessions, setTypeSessions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // 선택된 상담 유형이 변경될 때 데이터를 fetch합니다.
  useEffect(() => {
    if (!selectedTypeFilter) {
      setTypeSessions([])
      return
    }

    const fetchSessions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`http://localhost:8765/sessions?sheet_type=${encodeURIComponent(selectedTypeFilter)}`)
        if (!response.ok) {
          throw new Error('상담 기록을 불러오는데 실패했습니다.')
        }
        const data = await response.json()
        setTypeSessions(data)
      } catch (error) {
        addToast(error.message, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [selectedTypeFilter])

  const recentStudents = [...students]
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
    .slice(0, 5)

  const urgentStudents = students.filter(s =>
    s.tags?.some(t => ['자해 및 자살', '학교폭력 피해'].includes(t))
  )

  const handleGoToStudent = (session) => {
    const firstStudentName = session.name.split(',')[0].trim()
    const firstStudentId = session.studentId.split(',')[0].trim()
    
    const found = students.find(
      s => s.name.trim() === firstStudentName && s.studentId.trim() === firstStudentId
    )
    if (found) {
      setSelectedStudent(found)
    } else {
      addToast('해당 학생 정보를 목록에서 찾을 수 없습니다.', 'error')
    }
  }

  const handleEditSession = async (session) => {
    if (session.sheetType === '집단상담') {
      setSelectedStudent({ id: 'group_counseling', name: '집단상담 대장', isGroupTab: true })
      setSelectedSession(session)
      return
    }

    const firstStudentName = session.name.split(',')[0].trim()
    const firstStudentId = session.studentId.split(',')[0].trim()
    
    const found = students.find(
      s => s.name.trim() === firstStudentName && s.studentId.trim() === firstStudentId
    )
    if (found) {
      await setSelectedStudent(found)
      setSelectedSession(session)
      setEditorMode('edit')
      setEditorOpen(true)
    } else {
      addToast('해당 학생 정보를 목록에서 찾을 수 없습니다.', 'error')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-6" style={{ background: 'var(--bg-primary)' }}>
      {/* 고정 상단 영역 wrapper */}
      <div className="shrink-0">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>오늘의 상담</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--accent)' }}>
              학생들의 마음을 따뜻하게 감싸주는 오늘도 응원합니다! 🌟
            </p>
          </div>
          <div className="flex items-center gap-4 print-exclude">
            <SaveStateIndicator />
            <button
              onClick={onOpenPrintModal}
              className="flex items-center gap-1.5 rounded-xl text-xs font-semibold border px-3 py-1.5 transition-all duration-150 hover:bg-hover active:scale-95 cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
            >
              <Printer size={13} />
              상담일지 출력
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="mb-4">
          <StatCard icon={<BookOpen size={20} />} label="오늘 진행된 상담" value={todayStats.total} unit="건" color="var(--accent)" />
        </div>

        {/* 상담 유형 퀵 필터 버튼 그룹 */}
        <div className="mb-6">
          <SectionTitle icon={<BarChart2 size={14} style={{ color: 'var(--text-muted)' }} />} label="상담 유형별 모아보기" />
          <div className="grid grid-cols-5 gap-3 mt-2">
            {FILTER_TYPES.map(type => {
              const Icon = type.icon
              const isSelected = selectedTypeFilter === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedTypeFilter(isSelected ? null : type.id)}
                  className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition-all text-center cursor-pointer border select-none active:scale-95"
                  style={{
                    background: isSelected ? `linear-gradient(135deg, ${type.bg}, var(--bg-card))` : 'var(--bg-card)',
                    borderColor: isSelected ? type.color : 'var(--border)',
                    boxShadow: isSelected ? `0 4px 12px ${type.glow}` : 'var(--shadow-sm)',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = type.color
                      e.currentTarget.style.boxShadow = `0 4px 10px ${type.glow}`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200"
                    style={{ background: type.bg, color: type.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {type.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 스크롤 가능한 하단 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {/* 하단 뷰 분기 */}
        {selectedTypeFilter ? (
          /* 1. 상담 유형 필터링 모아보기 뷰 */
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle 
                icon={<Clock size={14} style={{ color: 'var(--accent)' }} />} 
                label={`최근 ${selectedTypeFilter} 기록 (${typeSessions.length}건)`} 
              />
              <button
                onClick={() => setSelectedTypeFilter(null)}
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all hover:bg-hover cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
              >
                <X size={12} />
                필터 해제
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>상담 기록을 조회하는 중입니다...</p>
              </div>
            ) : typeSessions.length > 0 ? (
              <div className="space-y-3">
                {typeSessions.map(session => (
                  <DashboardSessionRow 
                    key={session.id}
                    session={session}
                    onGoToStudent={() => handleGoToStudent(session)}
                    onEdit={() => handleEditSession(session)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                  등록된 {selectedTypeFilter} 기록이 없습니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 2. 기존 기본 대시보드 뷰 (주의 학생 & 최근 상담) */
          <>
            {/* 주의 학생 */}
            {urgentStudents.length > 0 && (
              <div className="mb-6">
                <SectionTitle icon={<AlertTriangle size={14} style={{ color: 'var(--red)' }} />} label="주의 필요 학생" />
                <div className="space-y-2">
                  {urgentStudents.map(s => (
                    <StudentRow 
                      key={s.id} 
                      student={s} 
                      onClick={() => setSelectedStudent(s)} 
                      onWrite={() => { setSelectedStudent(s); setEditorMode('new'); setEditorOpen(true); }}
                      urgent 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 최근 상담 학생 */}
            <div>
              <SectionTitle icon={<Clock size={14} style={{ color: 'var(--text-muted)' }} />} label="최근 상담" />
              <div className="space-y-2">
                {recentStudents.map(s => (
                  <StudentRow 
                    key={s.id} 
                    student={s} 
                    onClick={() => setSelectedStudent(s)} 
                    onWrite={() => { setSelectedStudent(s); setEditorMode('new'); setEditorOpen(true); }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color }) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}<span className="text-sm font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>{unit}</span>
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

function StudentRow({ student, onClick, onWrite, urgent }) {
  return (
    <div
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer"
      style={{ background: 'var(--bg-card)', border: `1px solid ${urgent ? 'rgba(242,104,104,0.3)' : 'var(--border)'}` }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
    >
      <Avatar name={student.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{student.name}</span>
          {urgent && <span className="text-xs px-1.5 py-0.5 rounded-lg font-medium" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>주의</span>}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{student.grade}학년 · 최근 {formatDate(student.lastDate)}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
          {student.sessionCount}회기
        </span>
        <button
          onClick={e => { e.stopPropagation(); onWrite(); }}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all"
          style={{ 
            borderColor: 'var(--accent)', 
            color: 'var(--accent)', 
            background: 'transparent' 
          }}
          onMouseEnter={e => { e.target.style.background = 'var(--accent-glow)' }}
          onMouseLeave={e => { e.target.style.background = 'transparent' }}
        >
          이어쓰기
        </button>
      </div>
    </div>
  )
}

function DashboardSessionRow({ session, onGoToStudent, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isDanger = ['자해 및 자살', '학교폭력 피해'].includes(session.type)

  const typeColors = {
    '자해 및 자살':   { border: 'var(--red)', bg: 'var(--red-soft)', text: 'var(--red)' },
    '학교폭력 피해':  { border: 'var(--red)', bg: 'var(--red-soft)', text: 'var(--red)' },
    '학교폭력 가해':  { border: 'var(--orange)', bg: 'var(--orange-soft)', text: 'var(--orange)' },
    '정신건강':       { border: 'var(--orange)', bg: 'var(--orange-soft)', text: 'var(--orange)' },
    '진로':           { border: 'var(--accent)', bg: 'var(--accent-soft)', text: 'var(--accent-dark)' },
    '학업':           { border: '#8b5cf6', bg: '#f5f3ff', text: '#8b5cf6' },
    '대인관계':       { border: 'var(--green)', bg: 'var(--green-soft)', text: 'var(--green)' },
    '일반상담':       { border: 'var(--text-secondary)', bg: 'var(--bg-hover)', text: 'var(--text-secondary)' },
    '기타':           { border: 'var(--text-muted)', bg: 'var(--bg-hover)', text: 'var(--text-secondary)' },
  }
  const color = typeColors[session.type] || { border: '#9ca3af', bg: '#f9fafb', text: '#4b5563' }

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`w-full flex flex-col gap-2 p-4 rounded-2xl border transition-all cursor-pointer group ${
        isDanger ? 'border-l-[6px]' : 'border-l-4'
      }`}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        borderLeftColor: color.border,
        boxShadow: 'var(--shadow-sm)'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 상단 헤더: 학생 정보 + 날짜 */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {session.name}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {session.grade ? `${session.grade}학년` : ''} {session.studentId ? `· ${session.studentId}` : ''} {session.gender ? `· ${session.gender}` : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              <Calendar size={10} style={{ color: 'var(--text-muted)' }} />
              <span>{formatDate(session.date)}</span>
              {session.session && (
                <span className="px-1 py-0.25 rounded bg-neutral-100 text-neutral-600 font-semibold text-[10px]">
                  {String(session.session).trim() === '단회' 
                    ? '단회' 
                    : (String(session.session).trim().endsWith('회기') 
                        ? String(session.session).trim() 
                        : `${String(session.session).trim()}회기`)}
                </span>
              )}
            </div>
          </div>

          {/* 중간 태그: 상담 세부 구분 */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: color.bg, color: color.text }}>
              {session.type}
            </span>
          </div>

          {/* 제목 */}
          <p className="text-[14px] leading-normal font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {session.summary}
          </p>

          {/* 본문 요약 (더보기 접기) */}
          {session.detail && (
            <p className={`text-xs leading-relaxed ${isExpanded ? 'block mt-1' : 'line-clamp-2 mt-1'}`} style={{ color: 'var(--text-secondary)' }}>
              {session.detail}
            </p>
          )}
          {session.detail && session.detail.length > 80 && (
            <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: 'var(--accent)' }}>
              {isExpanded ? '접기 ▲' : '더보기 ▼'}
            </span>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          {session.sheetType !== '집단상담' && (
            <button
              onClick={e => { e.stopPropagation(); onGoToStudent(); }}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-primary)'}
            >
              <ExternalLink size={11} />
              타임라인 이동
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-white"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Edit2 size={11} />
            수정
          </button>
        </div>
      </div>
    </div>
  )
}

