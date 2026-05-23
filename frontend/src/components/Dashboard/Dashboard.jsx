import { BarChart2, Clock, AlertTriangle, BookOpen, Archive, Printer } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar, formatDate, SaveStateIndicator } from '@/components/ui/shared'

export default function Dashboard({ onOpenPrintModal }) {
  const { students, todayStats, setSelectedStudent, setEditorOpen, setEditorMode } = useAppStore()

  const recentStudents = [...students]
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
    .slice(0, 5)

  const urgentStudents = students.filter(s =>
    s.tags?.some(t => ['자해 및 자살', '학교폭력 피해'].includes(t))
  )

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-primary)' }}>
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
      <div className="mb-6">
        <StatCard icon={<BookOpen size={20} />} label="오늘 진행된 상담" value={todayStats.total} unit="건" color="var(--accent)" />
      </div>

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
