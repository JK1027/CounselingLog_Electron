import { useEffect, useState } from 'react'
import { X, Loader } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function EditStudentModal({ isOpen, onClose, student }) {
  const { updateStudentInfo, addToast } = useAppStore()
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [grade, setGrade] = useState('')
  const [gender, setGender] = useState('남')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && student) {
      setName(student.name || '')
      setStudentId(student.studentId || '')
      setGrade(student.grade || '')
      setGender(student.gender || '남')
    }
  }, [student, isOpen])

  if (!isOpen || !student) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      addToast('이름을 입력해 주세요.', 'error')
      return
    }
    if (!studentId.trim() || studentId.length !== 4 || !/^\d+$/.test(studentId)) {
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

    setIsSaving(true)
    try {
      await updateStudentInfo(student.name, student.studentId, {
        name: name.trim(),
        studentId: studentId.trim(),
        grade,
        gender
      })
      onClose()
    } catch (err) {
      // Error is already toasted inside the store action
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-all p-6 flex flex-col gap-4"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>학생 정보 수정</h3>
          <button onClick={onClose} disabled={isSaving} className="hover:opacity-70 transition-opacity cursor-pointer">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isSaving}
              className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-400 transition-colors"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="이름 입력"
              required
            />
          </div>

          {/* 학번 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>학번 (4자리)</label>
            <input
              type="text"
              value={studentId}
              onChange={e => setStudentId(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              disabled={isSaving}
              className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-400 transition-colors"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="예: 2415"
              required
            />
          </div>

          {/* 학년 및 성별 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>학년</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                disabled={isSaving}
                className="w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer"
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
                {['남', '여', '혼합'].map(g => (
                  <button
                    key={g}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setGender(g)}
                    className="flex-1 h-full text-sm font-medium rounded-lg border transition-all cursor-pointer"
                    style={{
                      background: gender === g ? 'var(--accent)' : 'transparent',
                      color: gender === g ? '#fff' : 'var(--text-primary)',
                      borderColor: gender === g ? 'var(--accent)' : 'var(--border)',
                      boxShadow: gender === g ? '0 2px 6px var(--accent-glow)' : 'none'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-lg border transition-all hover:bg-neutral-50 cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
            >
              {isSaving ? (
                <>
                  <Loader size={12} className="animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
