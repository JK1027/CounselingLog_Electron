import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Loader } from 'lucide-react'

export default function PeerStudentManager({
  peerStudents,
  savePeerStudents,
  saveState,
  addToast,
  onCancel,
  onSaveSuccess
}) {
  const [tempStudents, setTempStudents] = useState([])
  const [newGrade, setNewGrade] = useState('4')
  const [newClass, setNewClass] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [newName, setNewName] = useState('')
  const [newStudentId, setNewStudentId] = useState('')

  // 컴포넌트 마운트 시 및 peerStudents 변경 시 임시 편집 리스트 초기화
  useEffect(() => {
    if (peerStudents) {
      setTempStudents(JSON.parse(JSON.stringify(peerStudents)))
    }
  }, [peerStudents])

  // 개별 필드 수정
  const handleEditField = (index, field, value) => {
    setTempStudents(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // 학생 제거
  const handleRemoveStudent = (index) => {
    setTempStudents(prev => prev.filter((_, idx) => idx !== index))
  }

  // 학생 추가
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
    if (newStudentId.trim()[0] !== String(newGrade)) {
      addToast('선택한 학년과 학번의 첫 번째 숫자가 일치하지 않습니다. 다시 확인해 주세요.', 'error')
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
    newName_reset()
  }

  const newName_reset = () => {
    setNewName('')
    setNewStudentId('')
    setNewNumber(prev => prev ? String(parseInt(prev, 10) + 1) : '')
  }

  // 명단 저장 및 서버 반영
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
      if (String(s.studentId).trim()[0] !== String(s.grade)) {
        addToast(`선택한 학년과 학번의 첫 번째 숫자가 일치하지 않는 학생이 있습니다: ${s.name}(${s.studentId})`, 'error')
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
    onSaveSuccess()
  }

  return (
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
          onClick={onCancel}
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
  )
}
