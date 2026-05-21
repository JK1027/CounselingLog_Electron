import { useState } from 'react'
import { Plus, FileText, Calendar, Layers, Edit2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar, TagBadge, formatDate } from '@/components/ui/shared'

export default function Timeline() {
  const { selectedStudent, sessions, selectedSession, setSelectedSession, setEditorOpen, setEditorMode } = useAppStore()

  if (!selectedStudent) {
    return <EmptyState />
  }

  const handleNewSession = () => {
    setEditorMode('new')
    setEditorOpen(true)
  }

  return (
    <main
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 학생 헤더 */}
      <div
        className="px-6 py-4 flex items-center justify-between shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-4">
          <Avatar name={selectedStudent.name} size="lg" />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {selectedStudent.name}
            </h2>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedStudent.grade}학년 · {selectedStudent.studentId} · {selectedStudent.gender}
              </span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)' }}
              >
                총 {selectedStudent.sessionCount}회기
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleNewSession}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 2px 8px rgba(75,142,241,0.35)' }}
        >
          <Plus size={15} />
          새 상담 기록
        </button>
      </div>

      {/* 태그 */}
      {selectedStudent.tags?.length > 0 && (
        <div className="px-6 py-2.5 flex items-center gap-2 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>상담 유형:</span>
          {selectedStudent.tags.map(tag => <TagBadge key={tag} type={tag} />)}
        </div>
      )}

      {/* 타임라인 */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session, idx) => (
              <SessionCard
                key={session.id}
                session={session}
                sessionNumber={sessions.length - idx}
                isSelected={selectedSession?.id === session.id}
                onClick={() => setSelectedSession(session)}
                onEdit={() => { setSelectedSession(session); setEditorMode('edit'); setEditorOpen(true) }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)' }}>
              <FileText size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">상담 기록이 없습니다.</p>
            <button
              onClick={handleNewSession}
              className="text-sm px-4 py-2 rounded-xl font-medium transition-all"
              style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              첫 상담 기록 추가하기
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function SessionCard({ session, sessionNumber, isSelected, onClick, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const typeColors = {
    '자해 및 자살':   { border: '#e05252', bg: '#fdf2f2' },
    '학교폭력 피해':  { border: '#e05252', bg: '#fdf2f2' },
    '학교폭력 가해':  { border: '#d97706', bg: '#fffbeb' },
    '정신건강':       { border: '#ea580c', bg: '#fff7ed' },
    '진로':           { border: '#2563eb', bg: '#eff6ff' },
    '학업':           { border: '#7c3aed', bg: '#f5f3ff' },
    '대인관계':       { border: '#059669', bg: '#ecfdf5' },
  }
  const color = typeColors[session.type] || { border: '#64748b', bg: '#f8fafc' }

  return (
    <div
      onClick={() => { onClick(); setIsExpanded(!isExpanded); }}
      className="rounded-2xl p-4 cursor-pointer transition-all duration-200 group"
      style={{
        background: 'var(--bg-card)',
        border: isSelected
          ? `1.5px solid var(--accent)`
          : '1.5px solid var(--border)',
        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderLeft: `4px solid ${color.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* 회기 번호 */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: color.bg, color: color.border }}
          >
            {sessionNumber}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: color.bg, color: color.border }}>
                {session.type}
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={10} />
                {formatDate(session.date)}
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Layers size={10} />
                {session.sheetType}
              </span>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {session.summary}
            </p>
            <p className={`text-xs leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`} style={{ color: 'var(--text-secondary)' }}>
              {session.detail}
            </p>
            {session.detail && session.detail.length > 80 && (
              <span className="text-[10px] font-bold mt-1.5 inline-block" style={{ color: 'var(--accent)' }}>
                {isExpanded ? '접기 ▲' : '더보기 ▼'}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)' }}
        >
          <Edit2 size={11} />
          수정
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  const { setCommandOpen } = useAppStore()
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'var(--accent-soft)', boxShadow: '0 4px 20px rgba(75,142,241,0.15)' }}
      >
        <FileText size={36} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          학생을 선택하세요
        </p>
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          좌측 목록에서 학생을 선택하거나
        </p>
        <button
          onClick={() => setCommandOpen(true)}
          className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
          style={{ color: 'var(--accent-dark)', background: 'var(--accent-soft)' }}
        >
          검색(⌘K)으로 빠르게 찾기
        </button>
      </div>
    </div>
  )
}
