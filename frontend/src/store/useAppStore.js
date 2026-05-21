import { create } from 'zustand'
import { MOCK_STUDENTS, MOCK_SESSIONS } from '@/data/mockData'
import { getChosung } from '@/utils/hangul'

export const useAppStore = create((set, get) => ({
  // 학생 목록
  students: MOCK_STUDENTS,

  // Toast 목록
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now()
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  // 선택된 학생
  selectedStudent: null,
  setSelectedStudent: (student) => set({ selectedStudent: student, sessions: MOCK_SESSIONS[student?.id] || [] }),

  // 현재 세션 목록
  sessions: [],

  // 선택된 세션
  selectedSession: null,
  setSelectedSession: (session) => set({ selectedSession: session }),

  // 검색어
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // Command Palette 열림 여부
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),

  // Quick Editor 패널 열림 여부
  editorOpen: false,
  setEditorOpen: (open) => set({ editorOpen: open }),

  // 편집 모드 (new | edit)
  editorMode: 'new',
  setEditorMode: (mode) => set({ editorMode: mode }),

  // ─── Mock 세션 저장 (1단계) ─────────────────────────────────────────────
  addSession: (formData) => {
    const { selectedStudent, sessions, students } = get()
    if (!selectedStudent) return

    const newSession = {
      id: Date.now(),
      studentId: selectedStudent.id,
      date: formData.date,
      session: sessions.length + 1,
      type: formData.type,
      sheetType: formData.sheetType,
      summary: formData.summary,
      detail: formData.detail,
    }

    // 세션 목록 앞에 추가 (최신순)
    const updatedSessions = [newSession, ...sessions]

    // 학생 sessionCount 증가 + lastDate 업데이트
    const updatedStudents = students.map(s =>
      s.id === selectedStudent.id
        ? { ...s, sessionCount: s.sessionCount + 1, lastDate: formData.date }
        : s
    )
    const updatedStudent = updatedStudents.find(s => s.id === selectedStudent.id)

    set({
      sessions: updatedSessions,
      students: updatedStudents,
      selectedStudent: updatedStudent,
      editorOpen: false,
    })
    get().addToast(`${updatedStudent.name} 학생의 새 상담 기록이 저장되었습니다.`, 'success')
  },

  // ─── Mock 세션 수정 (1단계) ─────────────────────────────────────────────
  updateSession: (sessionId, formData) => {
    const { sessions } = get()
    const updatedSessions = sessions.map(s =>
      s.id === sessionId ? { ...s, ...formData } : s
    )
    set({
      sessions: updatedSessions,
      selectedSession: null,
      editorOpen: false,
    })
    get().addToast('상담 기록이 수정되었습니다.', 'success')
  },

  // 필터된 학생 목록
  getFilteredStudents: () => {
    const { students, searchQuery } = get()
    if (!searchQuery) return students
    const q = searchQuery.toLowerCase()
    return students.filter(s => {
      const nameChosung = getChosung(s.name).toLowerCase()
      return s.name.toLowerCase().includes(q) ||
             nameChosung.includes(q) ||
             s.studentId.includes(q) ||
             s.grade.includes(q)
    })
  },
}))

