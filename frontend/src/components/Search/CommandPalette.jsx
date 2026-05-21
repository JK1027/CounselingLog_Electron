import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/shared'

export default function CommandPalette() {
  const { commandOpen, setCommandOpen, searchQuery, setSearchQuery, setSelectedStudent, getFilteredStudents } = useAppStore()
  const inputRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const students = getFilteredStudents()

  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    } else {
      setSearchQuery('')
    }
  }, [commandOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(!commandOpen)
      }
      if (e.key === 'Escape' && commandOpen) {
        setCommandOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandOpen])

  if (!commandOpen) return null

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

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-24"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={() => setCommandOpen(false)}
      >
        {/* 팔레트 */}
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
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
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                검색 결과가 없습니다.
              </div>
            ) : (
              <>
                <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  학생 {students.length}명
                </p>
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
        </div>
      </div>
    </>
  )
}
