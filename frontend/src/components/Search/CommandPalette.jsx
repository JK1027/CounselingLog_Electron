import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/shared'

export default function CommandPalette() {
  const { 
    commandOpen, 
    setCommandOpen, 
    registerOpen,
    setRegisterOpen,
    searchQuery, 
    setSearchQuery, 
    setSelectedStudent, 
    getFilteredStudents,
    registerVirtualStudent,
    addToast
  } = useAppStore()
  
  const inputRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    name: '',
    studentId: '',
    grade: '',
    gender: ''
  })

  const students = getFilteredStudents()

  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
      setShowRegisterForm(false)
      setRegisterForm({
        name: '',
        studentId: '',
        grade: '',
        gender: ''
      })
    } else if (registerOpen) {
      setSelectedIndex(0)
      setShowRegisterForm(true)
      setRegisterForm({
        name: '',
        studentId: '',
        grade: '',
        gender: '남'
      })
    } else {
      setSearchQuery('')
    }
  }, [commandOpen, registerOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(!commandOpen)
      }
      if (e.key === 'Escape' && (commandOpen || registerOpen)) {
        e.preventDefault()
        if (showRegisterForm && commandOpen) {
          setShowRegisterForm(false)
        } else {
          setCommandOpen(false)
          setRegisterOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandOpen, registerOpen, showRegisterForm])

  if (!commandOpen && !registerOpen) return null

  const handleSelect = (student) => {
    setSelectedStudent(student)
    setCommandOpen(false)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (students.length > 0 ? (prev + 1) % students.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (students.length > 0 ? (prev - 1 + students.length) % students.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (students[selectedIndex]) {
        handleSelect(students[selectedIndex])
      }
    }
  }

  const handleOpenRegister = () => {
    let initialName = ''
    let initialStudentId = ''
    let initialGrade = ''

    const trimmedQuery = searchQuery.trim()
    if (/^\d+$/.test(trimmedQuery)) {
      initialStudentId = trimmedQuery
      if (trimmedQuery.length >= 1) {
        const firstChar = trimmedQuery[0]
        if (['1', '2', '3', '4', '5', '6'].includes(firstChar)) {
          initialGrade = firstChar
        }
      }
    } else {
      initialName = trimmedQuery
    }

    setRegisterForm({
      name: initialName,
      studentId: initialStudentId,
      grade: initialGrade,
      gender: '남'
    })
    setShowRegisterForm(true)
  }

  const handleRegisterSubmit = () => {
    const { name, studentId, grade, gender } = registerForm
    if (!name.trim()) {
      addToast('이름을 입력해 주세요.', 'error')
      return
    }
    if (!studentId.trim() || studentId.length !== 4) {
      addToast('학번은 4자리 숫자로 입력해 주세요.', 'error')
      return
    }
    if (!grade) {
      addToast('학년을 선택해 주세요.', 'error')
      return
    }
    if (!gender) {
      addToast('성별을 선택해 주세요.', 'error')
      return
    }

    registerVirtualStudent(name.trim(), studentId.trim(), grade, gender)
  }

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-24"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={() => { setCommandOpen(false); setRegisterOpen(false); }}
      >
        {/* 팔레트 */}
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
          {showRegisterForm ? (
            /* 신규 학생 등록 폼 */
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>신규 학생 등록</h3>
                <button onClick={() => {
                  if (commandOpen) {
                    setShowRegisterForm(false)
                  } else {
                    setRegisterOpen(false)
                  }
                }} className="hover:opacity-70 transition-opacity">
                  <X size={18} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>이름</label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-400 transition-colors"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="이름 입력"
                  />
                </div>

                {/* 학번 */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>학번 (4자리)</label>
                  <input
                    type="text"
                    value={registerForm.studentId}
                    onChange={e => setRegisterForm({ ...registerForm, studentId: e.target.value.replace(/\D/g, '') })}
                    maxLength={4}
                    className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-400 transition-colors"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="예: 2415"
                  />
                </div>

                {/* 학년 및 성별 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>학년</label>
                    <select
                      value={registerForm.grade}
                      onChange={e => setRegisterForm({ ...registerForm, grade: e.target.value })}
                      className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-400 transition-colors"
                      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">학년 선택</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                      <option value="4">4학년</option>
                      <option value="5">5학년</option>
                      <option value="6">6학년</option>
                      <option value="혼합">혼합</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>성별</label>
                    <div className="flex gap-2 h-[38px] items-center">
                      {['남', '여'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, gender: g })}
                          className="flex-1 h-full text-sm font-medium rounded-lg border transition-all"
                          style={{
                            background: registerForm.gender === g ? 'var(--accent)' : 'transparent',
                            color: registerForm.gender === g ? '#fff' : 'var(--text-primary)',
                            borderColor: registerForm.gender === g ? 'var(--accent)' : 'var(--border)',
                            boxShadow: registerForm.gender === g ? '0 2px 6px var(--accent-glow)' : 'none'
                          }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (commandOpen) {
                      setShowRegisterForm(false)
                    } else {
                      setRegisterOpen(false)
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border transition-all hover:bg-neutral-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleRegisterSubmit}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-md"
                  style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
                >
                  등록 및 상담 작성
                </button>
              </div>
            </div>
          ) : (
            /* 기존 검색창 및 리스트 */
            <>
              {/* 검색 입력 */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <Search size={18} style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="이름, 학번 또는 초성(예: ㄱㅁㅅ)으로 검색..."
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X size={16} style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
                <kbd className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  ESC
                </kbd>
              </div>

              {/* 결과 목록 */}
              <div className="py-2 max-h-72 overflow-y-auto">
                {students.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm flex flex-col items-center justify-center gap-3">
                    <span style={{ color: 'var(--text-muted)' }}>검색 결과가 없습니다.</span>
                    <button
                      onClick={handleOpenRegister}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition-all"
                      style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
                    >
                      + 신규 학생 등록
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center px-4 py-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        학생 {students.length}명
                      </p>
                      <button
                        onClick={handleOpenRegister}
                        className="text-xs font-semibold transition-all hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        + 신규 학생 등록
                      </button>
                    </div>
                    {students.map((student, idx) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelect(student)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left group"
                        style={{
                          background: selectedIndex === idx ? 'var(--bg-hover)' : 'transparent'
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Avatar name={student.name} size="sm" selected={selectedIndex === idx} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: selectedIndex === idx ? 'var(--accent-dark)' : 'var(--text-primary)' }}>{student.name}</p>
                          <p className="text-xs" style={{ color: selectedIndex === idx ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {student.grade}학년 · {student.studentId} · {student.sessionCount}회기
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* 하단 단축키 힌트 */}
              <div
                className="px-4 py-2.5 flex items-center gap-4 text-xs"
                style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-primary)' }}
              >
                <span><kbd className="px-1.5 py-0.5 rounded border border-neutral-200" style={{ background: 'var(--bg-card)' }}>↑↓</kbd> 이동</span>
                <span><kbd className="px-1.5 py-0.5 rounded border border-neutral-200" style={{ background: 'var(--bg-card)' }}>↵</kbd> 선택</span>
                <span><kbd className="px-1.5 py-0.5 rounded border border-neutral-200" style={{ background: 'var(--bg-card)' }}>ESC</kbd> 닫기</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
