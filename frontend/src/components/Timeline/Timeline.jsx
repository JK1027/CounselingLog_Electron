import { useState, useEffect } from 'react'
import { Plus, FileText, Calendar, Layers, Edit2, Trash2, Printer } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar, TagBadge, formatDate, SaveStateIndicator } from '@/components/ui/shared'
import EditStudentModal from '@/components/Student/EditStudentModal'

export default function Timeline({ onOpenPrintModal }) {
  const { selectedStudent, sessions, selectedSession, setSelectedSession, setEditorOpen, setEditorMode, isCompactMode, deleteSession } = useAppStore()
  const [selectedSheetFilter, setSelectedSheetFilter] = useState('전체')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // 학생 변경 시 필터 '전체'로 초기화
  useEffect(() => {
    setSelectedSheetFilter('전체')
  }, [selectedStudent?.id])

  if (!selectedStudent) {
    return <EmptyState />
  }

  const handleNewSession = () => {
    setEditorMode('new')
    setEditorOpen(true)
  }

  const getCountForFilter = (filter) => {
    if (filter === '전체') return sessions?.length || 0
    return sessions?.filter(s => s.sheetType === filter).length || 0
  }

  const filteredSessions = sessions ? sessions.filter(session => {
    if (selectedSheetFilter === '전체') return true
    return session.sheetType === selectedSheetFilter
  }) : []

  return (
    <main
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 학생 헤더 */}
      <div
        className={`flex items-center justify-between shrink-0 transition-all ${
          isCompactMode ? 'px-4 py-2.5' : 'px-6 py-4'
        }`}
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className={`flex items-center ${isCompactMode ? 'gap-3' : 'gap-4'}`}>
          <Avatar name={selectedStudent.name} size={isCompactMode ? "md" : "lg"} />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className={`${isCompactMode ? 'text-base' : 'text-lg'} font-bold`} style={{ color: 'var(--text-primary)' }}>
                {selectedStudent.name}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                title="학생 개인정보 수정"
                className="p-1 rounded-lg hover:bg-hover hover:text-accent transition-colors cursor-pointer inline-flex items-center justify-center"
                style={{ color: 'var(--text-muted)' }}
              >
                <Edit2 size={isCompactMode ? 13 : 15} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className={isCompactMode ? 'text-xs' : 'text-sm'} style={{ color: 'var(--text-secondary)' }}>
                {selectedStudent.grade}학년 · {selectedStudent.studentId} · {selectedStudent.gender} {selectedStudent.ban && `· ${selectedStudent.ban}반`}
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

        <div className="flex items-center gap-4 print-exclude">
          <SaveStateIndicator />
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPrintModal}
              className={`flex items-center gap-1.5 rounded-xl text-sm font-semibold border transition-all duration-150 hover:bg-hover active:scale-95 cursor-pointer ${
                isCompactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
              }`}
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
            >
              <Printer size={isCompactMode ? 13 : 15} />
              인쇄
            </button>
            <button
              onClick={handleNewSession}
              className={`flex items-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95 cursor-pointer ${
                isCompactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
              }`}
              style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 2px 8px rgba(75,142,241,0.35)' }}
            >
              <Plus size={isCompactMode ? 13 : 15} />
              새 상담 기록
            </button>
          </div>
        </div>
      </div>

      {/* 태그 */}
      {selectedStudent.tags?.length > 0 && (
        <div className={`flex items-center gap-2 shrink-0 ${isCompactMode ? 'px-4 py-1.5' : 'px-6 py-2.5'}`}
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>상담 유형:</span>
          {selectedStudent.tags.map(tag => <TagBadge key={tag} type={tag} />)}
        </div>
      )}

      {/* 상담 시트 유형 필터 탭 바 */}
      <div 
        className={`flex items-center gap-1.5 shrink-0 overflow-x-auto select-none no-scrollbar ${isCompactMode ? 'px-4 py-2' : 'px-6 py-3'}`}
        style={{ 
          borderBottom: '1px solid var(--border)', 
          background: 'var(--bg-secondary)'
        }}
      >
        {['전체', '개인상담', '보호자상담', '교원자문', '의뢰'].map(filter => {
          const count = getCountForFilter(filter)
          const isActive = selectedSheetFilter === filter
          return (
            <button
              key={filter}
              onClick={() => setSelectedSheetFilter(filter)}
              className={`flex items-center gap-1.5 rounded-full shrink-0 transition-all cursor-pointer font-bold ${
                isCompactMode ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
              }`}
              style={{
                background: isActive ? 'var(--accent)' : 'var(--bg-primary)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                boxShadow: isActive ? '0 2px 6px rgba(75,142,241,0.2)' : 'none'
              }}
            >
              <span>{filter}</span>
              <span 
                className="rounded-full px-1.5 py-0.25 text-[10px] font-bold"
                style={{ 
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-hover)',
                  color: isActive ? 'white' : 'var(--text-muted)'
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 타임라인 */}
      <div className={`flex-1 overflow-y-auto ${isCompactMode ? 'px-4 py-3' : 'px-6 py-5'}`}>
        {sessions && sessions.length > 0 ? (
          filteredSessions.length > 0 ? (
            <div className={isCompactMode ? 'space-y-1.5' : 'space-y-3'}>
              {filteredSessions.map((session, idx) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  sessionNumber={filteredSessions.length - idx}
                  isSelected={selectedSession?.id === session.id}
                  onClick={() => setSelectedSession(session)}
                  onEdit={() => { setSelectedSession(session); setEditorMode('edit'); setEditorOpen(true) }}
                  onDelete={() => deleteSession(session.id)}
                  isCompact={isCompactMode}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-center">
              <p style={{ color: 'var(--text-muted)' }} className="text-sm font-semibold">
                선택한 유형('{selectedSheetFilter}')의 상담 기록이 없습니다.
              </p>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                다른 필터 탭을 선택해 주십시오.
              </p>
            </div>
          )
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

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudent}
      />
    </main>
  )
}

function SessionCard({ session, sessionNumber, isSelected, onClick, onEdit, onDelete, isCompact }) {
  const [isExpanded, setIsExpanded] = useState(false)
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

  const sheetTypeColors = {
    '개인상담': 'bg-blue-50/80 text-blue-700 border-blue-100/50',
    '집단상담': 'bg-indigo-50/80 text-indigo-700 border-indigo-100/50',
    '보호자상담': 'bg-emerald-50/80 text-emerald-700 border-emerald-100/50',
    '교원자문': 'bg-purple-50/80 text-purple-700 border-purple-100/50',
    '의뢰': 'bg-pink-50/80 text-pink-700 border-pink-100/50',
  }
  const sheetClass = sheetTypeColors[session.sheetType] || 'bg-gray-50 text-gray-700 border-gray-100'

  const isDanger = ['자해 및 자살', '학교폭력 피해'].includes(session.type)

  return (
    <div
      onClick={() => { onClick(); setIsExpanded(!isExpanded); }}
      className={`cursor-pointer transition-all duration-200 group ${
        isDanger ? 'border-l-[6px]' : 'border-l-4'
      } ${
        isCompact ? 'rounded-xl p-2.5' : 'rounded-2xl p-4'
      }`}
      style={{
        background: 'var(--bg-card)',
        borderTop: isSelected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
        borderRight: isSelected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
        borderBottom: isSelected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
        borderLeftColor: color.border,
        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      <div className={`flex items-start justify-between ${isCompact ? 'gap-2' : 'gap-3'}`}>
        <div className={`flex items-start ${isCompact ? 'gap-2' : 'gap-3'} flex-1 min-w-0`}>
          {/* 회기 번호 */}
          <div
            className={`rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isCompact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
            }`}
            style={{ background: color.bg, color: color.text }}
          >
            {sessionNumber}
          </div>

          <div className="flex-1 min-w-0">
            {/* 상단 태그 및 메타데이터 계층 구분 */}
            <div className={`flex items-center justify-between gap-2 flex-wrap ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: color.bg, color: color.text }}>
                  {session.type}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${sheetClass}`}>
                  {session.sheetType}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <Calendar size={10} style={{ color: 'var(--text-muted)' }} />
                <span>{formatDate(session.date)}</span>
                {session.session && (
                  <span className="px-1 py-0.25 rounded bg-gray-100 text-gray-600 font-semibold text-[10px]">
                    {String(session.session).trim() === '단회' 
                      ? '단회' 
                      : (String(session.session).trim().endsWith('회기') 
                          ? String(session.session).trim() 
                          : `${String(session.session).trim()}회기`)}
                  </span>
                )}
              </div>
            </div>
            
            {/* 제목 강조 및 컴팩트 줄간격 */}
            <p className={`${isCompact ? 'text-xs leading-snug font-bold' : 'text-[15px] leading-normal font-bold'} mb-0.5`} style={{ color: 'var(--text-primary)' }}>
              {session.summary}
            </p>
            
            {/* 내용 및 컴팩트 줄간격 */}
            {session.detail && (
              <p className={`text-xs ${
                isCompact 
                  ? (isExpanded ? 'block mt-1 leading-normal' : 'line-clamp-1 opacity-70 mt-0.5 leading-snug') 
                  : (isExpanded ? 'block mt-1 leading-relaxed' : 'line-clamp-2 mt-1 leading-relaxed')
              }`} style={{ color: 'var(--text-secondary)' }}>
                {session.detail}
              </p>
            )}
            {session.detail && session.detail.length > (isCompact ? 40 : 80) && (
              <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: 'var(--accent)' }}>
                {isExpanded ? '접기 ▲' : '더보기 ▼'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className={`flex items-center gap-1 ${
              isCompact ? 'text-[10px] px-2 py-1 rounded-md' : 'text-xs px-2.5 py-1.5 rounded-lg'
            }`}
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)' }}
          >
            <Edit2 size={isCompact ? 10 : 11} />
            수정
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              if (window.confirm("정말로 이 상담 기록을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
                onDelete();
              }
            }}
            className={`flex items-center gap-1 ${
              isCompact ? 'text-[10px] px-2 py-1 rounded-md' : 'text-xs px-2.5 py-1.5 rounded-lg'
            }`}
            style={{ background: '#fef2f2', color: '#ef4444' }}
          >
            <Trash2 size={isCompact ? 10 : 11} />
            삭제
          </button>
        </div>
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

