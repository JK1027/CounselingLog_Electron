import { useState, useEffect } from 'react'
import { X, CheckSquare, Square, Check, Settings, Plus, Trash2, ArrowLeft, Loader } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function PeerCounselDialog({ isOpen, onClose, onComplete }) {
  const { peerStudents, loadPeerStudents, savePeerStudents, saveState, addToast } = useAppStore()
  
  const [viewMode, setViewMode] = useState('dialog') // 'dialog' | 'manage'
  const [summary, setSummary] = useState('또래상담 프로그램')
  const [detail, setDetail] = useState('또래상담 기본교육')
  const [attendedIds, setAttendedIds] = useState([])

  // 명단 관리용 임시 상태
  const [tempStudents, setTempStudents] = useState([])
  // 신규 학생 추가용 입력 폼 상태
  const [newGrade, setNewGrade] = useState('4')
  const [newClass, setNewClass] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [newName, setNewName] = useState('')
  const [newStudentId, setNewStudentId] = useState('')

  // 모달이 열릴 때 초기화 및 명단 로드
  useEffect(() => {
    if (isOpen) {
      setViewMode('dialog')
      setSummary('또래상담 프로그램')
      setDetail('또래상담 기본교육')
      
      const initLoad = async () => {
        await loadPeerStudents()
      }
      initLoad()
    }
  }, [isOpen, loadPeerStudents])

  // 명단 로드가 끝나면 기본적으로 모든 학생을 참석 대상으로 설정
  useEffect(() => {
    if (isOpen && peerStudents && peerStudents.length > 0) {
      setAttendedIds(peerStudents.map(s => s.studentId))
    }
  }, [peerStudents, isOpen])

  // 명단 관리 모드로 진입 시 임시 상태 초기화
  useEffect(() => {
    if (viewMode === 'manage') {
      setTempStudents(JSON.parse(JSON.stringify(peerStudents)))
      // 신규 입력 폼 초기화
      setNewGrade('4')
      setNewClass('')
      setNewNumber('')
      setNewName('')
      setNewStudentId('')
    }
  }, [viewMode, peerStudents])

  if (!isOpen) return null

  // 개별 학생 참석 토글
  const handleToggleStudent = (studentId) => {
    setAttendedIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
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

    const attended = peerStudents.filter(s => attendedIds.includes(s.studentId))
    const absent = peerStudents.filter(s => !attendedIds.includes(s.studentId))

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

  // 명단 관리: 개별 필드 수정
  const handleEditField = (index, field, value) => {
    setTempStudents(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // 명단 관리: 학생 제거
  const handleRemoveStudent = (index) => {
    setTempStudents(prev => prev.filter((_, idx) => idx !== index))
  }

  // 명단 관리: 학생 추가
  const handleAddStudent = () => {
    if (!newName.trim()) {
      addToast('이름을 입력해 주세요.', 'error')
      return
    }
    if (!newStudentId.trim() || newStudentId.length !== 4 || !/^\d{4}$/.test(newStudentId)) {
      addToast('학번은 4자리 숫자로 입력해 주세요 (예: 4103).', 'error')
      return
    }
    if (!newGrade) {
      addToast('학년을 선택해 주세요.', 'error')
      return
    }
    if (!newClass || isNaN(newClass)) {
      addToast('반을 숫자로 입력해 주세요.', 'error')
      return
    }
    if (!newNumber || isNaN(newNumber)) {
      addToast('번호를 숫자로 입력해 주세요.', 'error')
      return
    }

    // 중복 학번 검사
    const isDuplicate = tempStudents.some(s => s.studentId === newStudentId.trim())
    if (isDuplicate) {
      addToast('이미 명단에 존재하는 학번입니다.', 'error')
      return
    }

    const newStudent = {
      grade: parseInt(newGrade, 10),
      class: parseInt(newClass, 10),
      number: parseInt(newNumber, 10),
      name: newName.trim(),
      studentId: newStudentId.trim()
    }

    setTempStudents(prev => [...prev, newStudent])
    
    // 입력창 초기화 (일부 필드 유지)
    setNewName('')
    setNewStudentId('')
    setNewNumber(prev => prev ? String(parseInt(prev, 10) + 1) : '')
  }

  // 명단 관리: 저장 및 서버 반영
  const handleSaveStudentsList = async () => {
    // 최종 검증
    for (const s of tempStudents) {
      if (!String(s.name).trim()) {
        addToast('이름이 비어 있는 학생이 있습니다.', 'error')
        return
      }
      if (!String(s.studentId).trim() || !/^\d{4}$/.test(s.studentId)) {
        addToast(`학번 형식이 잘못되었습니다: ${s.name}(${s.studentId})`, 'error')
        return
      }
    }

    // 정렬 (학년 -> 반 -> 번호 순)
    const sorted = [...tempStudents].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade
      if (a.class !== b.class) return a.class - b.class
      return a.number - b.number
    })

    await savePeerStudents(sorted)
    setViewMode('dialog')
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && saveState !== 'saving') onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl transition-all p-6 flex flex-col gap-4 max-h-[90vh]"
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
            <div className="flex items-center gap-2">
              {viewMode === 'manage' && (
                <button 
                  onClick={() => setViewMode('dialog')}
                  className="p-1 rounded hover:bg-hover transition-colors cursor-pointer mr-1"
                >
                  <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              )}
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {viewMode === 'dialog' ? '또래상담 입력 도우미' : '또래상담 명단 설정'}
              </h3>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {viewMode === 'dialog' 
                ? '활동 내역과 학생 참여 현황을 기반으로 일지를 구성합니다.' 
                : '또래상담 학생들의 기초 명단을 수정, 추가, 삭제합니다.'}
            </p>
          </div>
          
          {viewMode === 'dialog' ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('manage')}
                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border hover:bg-neutral-50 transition-all cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <Settings size={12} />
                명단 설정
              </button>
              <button onClick={onClose} className="hover:opacity-70 transition-opacity cursor-pointer p-1">
                <X size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          ) : (
            <button onClick={onClose} disabled={saveState === 'saving'} className="hover:opacity-70 transition-opacity cursor-pointer p-1">
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* 바디 영역 분기 */}
        {viewMode === 'dialog' ? (
          /* ─── 대화창(활동 입력) 모드 ─── */
          <>
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
                      (참석: {attendedIds.length} / {peerStudents.length}명)
                    </span>
                  </label>
                  
                  {/* 전체제어 단추 */}
                  <div className="flex gap-2 text-[10px] font-bold">
                    <button 
                      onClick={() => setAttendedIds(peerStudents.map(s => s.studentId))} 
                      className="px-2 py-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer text-indigo-500"
                    >
                      전체 선택
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button 
                      onClick={() => setAttendedIds([])} 
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
                  {peerStudents.map(s => {
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
          </>
        ) : (
          /* ─── 명단 설정(관리) 모드 ─── */
          <>
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar flex flex-col gap-3 min-h-[300px] max-h-[50vh]">
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-6 gap-2 text-[10px] font-bold px-2 py-1 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-lg text-center" style={{ color: 'var(--text-secondary)' }}>
                <span>학년</span>
                <span>반</span>
                <span>번호</span>
                <span className="col-span-2">이름</span>
                <span>학번</span>
              </div>
              
              {/* 학생 리스트 편집 테이블 */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1 no-scrollbar">
                {tempStudents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400 font-medium">
                    등록된 또래상담 학생이 없습니다. 아래 폼을 통해 추가해주세요.
                  </div>
                ) : (
                  tempStudents.map((s, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2 items-center text-center">
                      {/* 학년 */}
                      <select
                        value={s.grade}
                        onChange={e => handleEditField(index, 'grade', parseInt(e.target.value, 10))}
                        className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none cursor-pointer"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                      </select>

                      {/* 반 */}
                      <input
                        type="number"
                        value={s.class}
                        onChange={e => handleEditField(index, 'class', parseInt(e.target.value, 10) || '')}
                        className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                        min="1"
                      />

                      {/* 번호 */}
                      <input
                        type="number"
                        value={s.number}
                        onChange={e => handleEditField(index, 'number', parseInt(e.target.value, 10) || '')}
                        className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                        min="1"
                      />

                      {/* 이름 */}
                      <input
                        type="text"
                        value={s.name}
                        onChange={e => handleEditField(index, 'name', e.target.value)}
                        className="text-[11px] p-1.5 rounded-lg border bg-transparent outline-none col-span-2 px-2.5 font-bold"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                        placeholder="이름"
                      />

                      {/* 학번 & 삭제 버튼 결합 */}
                      <div className="flex items-center gap-1.5 justify-end">
                        <input
                          type="text"
                          value={s.studentId}
                          onChange={e => handleEditField(index, 'studentId', e.target.value.replace(/\D/g, ''))}
                          className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none w-14 font-semibold"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                          maxLength={4}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(index)}
                          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 text-neutral-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 신규 학생 가로 추가 폼 */}
              <div className="border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
                <label className="block text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>새 학생 명단 추가</label>
                <div className="grid grid-cols-6 gap-2 items-center text-center">
                  {/* 학년 */}
                  <select
                    value={newGrade}
                    onChange={e => setNewGrade(e.target.value)}
                    className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                  >
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                    <option value="4">4학년</option>
                    <option value="5">5학년</option>
                    <option value="6">6학년</option>
                  </select>

                  {/* 반 */}
                  <input
                    type="text"
                    value={newClass}
                    onChange={e => setNewClass(e.target.value.replace(/\D/g, ''))}
                    className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                    placeholder="반"
                  />

                  {/* 번호 */}
                  <input
                    type="text"
                    value={newNumber}
                    onChange={e => setNewNumber(e.target.value.replace(/\D/g, ''))}
                    className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                    placeholder="번호"
                  />

                  {/* 이름 */}
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="text-[11px] p-1.5 rounded-lg border bg-transparent outline-none col-span-2 px-2.5 font-bold"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                    placeholder="새 이름 입력"
                  />

                  {/* 학번 & 추가 단추 결합 */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <input
                      type="text"
                      value={newStudentId}
                      onChange={e => setNewStudentId(e.target.value.replace(/\D/g, ''))}
                      className="text-[11px] p-1.5 rounded-lg border bg-transparent text-center outline-none w-14 font-semibold"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                      placeholder="학번"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 text-indigo-500 transition-all cursor-pointer shrink-0 border"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 제어 영역 */}
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('dialog')}
                disabled={saveState === 'saving'}
                className="px-4 py-2 text-xs font-semibold rounded-lg border transition-all hover:bg-neutral-50 cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                취소
              </button>
              <button
                onClick={handleSaveStudentsList}
                disabled={saveState === 'saving'}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
              >
                {saveState === 'saving' ? (
                  <>
                    <Loader size={13} className="animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    명단 저장
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
