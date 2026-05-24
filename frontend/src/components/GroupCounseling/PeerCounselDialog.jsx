import { useState, useEffect } from 'react'
import { X, CheckSquare, Square, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import studentsData from '@/data/peer_counsel_students.json'

export default function PeerCounselDialog({ isOpen, onClose, onComplete }) {
  const { addToast } = useAppStore()
  const [summary, setSummary] = useState('또래상담 프로그램')
  const [detail, setDetail] = useState('또래상담 기본교육')
  const [attendedIds, setAttendedIds] = useState([])

  // 모달이 열릴 때 기본값으로 모든 학생들을 선택하도록 초기화
  useEffect(() => {
    if (isOpen) {
      setSummary('또래상담 프로그램')
      setDetail('또래상담 기본교육')
      setAttendedIds(studentsData.map(s => s.studentId))
    }
  }, [isOpen])

  if (!isOpen) return null

  // 개별 학생 참석 토글
  const handleToggleStudent = (studentId) => {
    setAttendedIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  // 전체 선택
  const handleSelectAll = () => {
    setAttendedIds(studentsData.map(s => s.studentId))
  }

  // 전체 해제
  const handleDeselectAll = () => {
    setAttendedIds([])
  }

  // 데이터 최종 가공 및 완성
  const handleCompleteClick = () => {
    if (!summary.trim()) {
      addToast('활동 제목을 입력해 주세요.', 'error')
      return
    }
    if (!detail.trim()) {
      addToast('활동 내용을 입력해 주세요.', 'error')
      return
    }

    const attended = studentsData.filter(s => attendedIds.includes(s.studentId))
    const absent = studentsData.filter(s => !attendedIds.includes(s.studentId))

    const attendedText = attended.map(s => `${s.name}(${s.grade}-${s.class})`).join(', ')
    const absentText = absent.map(s => `${s.name}(${s.grade}-${s.class})`).join('\n')

    // 참여/미참여 포맷 조립
    const compiledDetail = `${detail.trim()}

참여학생:
${attendedText || '없음'}

미참여학생:
${absentText || '없음'}`

    onComplete({
      summary: summary.trim(),
      studentId: '4학년~6학년',
      detail: compiledDetail
    })
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all p-6 flex flex-col gap-4 max-h-[90vh]"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center pb-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>또래상담 입력 도우미</h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>활동 내역과 학생 참여 현황을 기반으로 일지를 구성합니다.</p>
          </div>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity cursor-pointer">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* 바디 스크롤 */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
          {/* 활동 제목 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>활동 제목</label>
            <input
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-400 transition-colors font-semibold"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="예: 또래상담 프로그램"
            />
          </div>

          {/* 활동 내용 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>활동 내용 (본문)</label>
            <textarea
              rows={3}
              value={detail}
              onChange={e => setDetail(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-400 transition-colors font-medium resize-none leading-relaxed"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="진행한 또래상담 세부 활동 내용을 적어주세요."
            />
          </div>

          {/* 학생 체크리스트 영역 */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                또래상담 학생 현황 
                <span className="ml-1.5 font-extrabold text-indigo-500" style={{ color: 'var(--accent)' }}>
                  (참석: {attendedIds.length} / {studentsData.length}명)
                </span>
              </label>
              
              {/* 전체제어 단추 */}
              <div className="flex gap-2 text-[10px] font-bold">
                <button 
                  onClick={handleSelectAll} 
                  className="px-2 py-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer text-indigo-500"
                >
                  전체 선택
                </button>
                <span className="text-neutral-300">|</span>
                <button 
                  onClick={handleDeselectAll} 
                  className="px-2 py-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500"
                >
                  전체 해제
                </button>
              </div>
            </div>

            {/* 학생 그리드 */}
            <div 
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl border max-h-48 overflow-y-auto no-scrollbar"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
            >
              {studentsData.map(s => {
                const isAttended = attendedIds.includes(s.studentId)
                return (
                  <button
                    key={s.studentId}
                    onClick={() => handleToggleStudent(s.studentId)}
                    className="flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer group hover:scale-[1.01]"
                    style={{
                      background: isAttended ? 'var(--bg-card)' : 'transparent',
                      borderColor: isAttended ? 'var(--accent)' : 'var(--border)'
                    }}
                  >
                    <div className="shrink-0 text-indigo-500" style={{ color: isAttended ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {isAttended ? (
                        <CheckSquare size={14} className="fill-indigo-50/50" />
                      ) : (
                        <Square size={14} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {s.name}
                      </p>
                      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        {s.grade}-{s.class} ({s.studentId})
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 하단 제어 영역 */}
        <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border transition-all hover:bg-neutral-50 cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            취소
          </button>
          <button
            onClick={handleCompleteClick}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            <Check size={13} />
            완료 및 폼 주입
          </button>
        </div>
      </div>
    </div>
  )
}
