import { create } from 'zustand'
import { getChosung } from '@/utils/hangul'

const API_BASE = 'http://localhost:8765'

export const useAppStore = create((set, get) => ({
  // 학생 목록
  students: [],

  // 오늘 대시보드 통계
  todayStats: { total: 0, pending: 0, guardian: 0, referral: 0 },

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
  setSelectedStudent: async (student) => {
    set({ selectedStudent: student })
    await get().loadSessions(student)
  },

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

  // ─── API 초기화 ────────────────────────────────────────────────────────
  initialize: async () => {
    try {
      const resStudents = await fetch(`${API_BASE}/students`)
      if (!resStudents.ok) throw new Error('학생 목록 로드 실패')
      const studentsData = await resStudents.json()

      const resStats = await fetch(`${API_BASE}/stats/today`)
      if (!resStats.ok) throw new Error('대시보드 통계 로드 실패')
      const statsData = await resStats.json()

      set({ 
        students: studentsData, 
        todayStats: statsData 
      })
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 특정 학생 상담 이력 로드 ──────────────────────────────────────────
  loadSessions: async (student) => {
    if (!student) {
      set({ sessions: [] })
      return
    }
    // 임시 등록된 신규 학생은 세션 이력이 없음
    if (String(student.id).startsWith('NEW_')) {
      set({ sessions: [] })
      return
    }
    try {
      const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(student.name)}?student_id=${encodeURIComponent(student.studentId || '')}`)
      if (!res.ok) throw new Error('상담 이력을 불러오지 못했습니다.')
      const data = await res.json()
      set({ sessions: data })
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 신규 가상 학생 등록 (QuickEditor 실행 전) ──────────────────────────
  registerVirtualStudent: (name, studentId, grade, gender) => {
    const newVirtualStudent = {
      id: `NEW_${name}_${studentId}_${Date.now()}`,
      name,
      studentId,
      grade,
      gender,
      sessionCount: 0,
      lastDate: '',
      tags: ['신규']
    }
    
    set(state => ({
      students: [newVirtualStudent, ...state.students],
      selectedStudent: newVirtualStudent,
      sessions: [],
      commandOpen: false,
      editorOpen: true,
      editorMode: 'new'
    }))
    
    get().addToast(`${name} 학생이 신규 등록되었습니다. 상담을 입력해 주세요.`, 'success')
  },

  // ─── 세션 저장 ─────────────────────────────────────────────────────────
  addSession: async (formData) => {
    const { selectedStudent } = get()
    if (!selectedStudent) return

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedStudent.name,
          studentId: selectedStudent.studentId,
          grade: selectedStudent.grade,
          gender: selectedStudent.gender,
          ...formData
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || '상담 저장 실패')
      }
      
      // Reload students and todayStats
      await get().initialize()
      
      // Find the saved student in the newly fetched list
      const newStudents = get().students
      const savedStudent = newStudents.find(
        s => s.name === selectedStudent.name && s.studentId === selectedStudent.studentId
      )
      
      if (savedStudent) {
        set({ selectedStudent: savedStudent })
        await get().loadSessions(savedStudent)
      } else {
        // Fallback: If not found, select first student
        set({ selectedStudent: newStudents[0] })
        if (newStudents[0]) {
          await get().loadSessions(newStudents[0])
        }
      }
      
      set({ editorOpen: false })
      get().addToast(`${selectedStudent.name} 학생의 새 상담 기록이 저장되었습니다.`, 'success')
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 세션 수정 ─────────────────────────────────────────────────────────
  updateSession: async (sessionId, formData) => {
    const { selectedStudent } = get()
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || '상담 수정 실패')
      }
      
      // Reload stats and student lists
      await get().initialize()
      
      // Re-load selected student to sync latest data
      if (selectedStudent) {
        const newStudents = get().students
        const updatedStudent = newStudents.find(
          s => s.name === selectedStudent.name && s.studentId === selectedStudent.studentId
        )
        if (updatedStudent) {
          set({ selectedStudent: updatedStudent })
        }
        await get().loadSessions(selectedStudent)
      }
      
      set({ selectedSession: null, editorOpen: false })
      get().addToast('상담 기록이 수정되었습니다.', 'success')
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 수동 백업 ─────────────────────────────────────────────────────────
  triggerBackup: async () => {
    try {
      const res = await fetch(`${API_BASE}/backup`, { method: 'POST' })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || '백업 생성 실패')
      }
      const data = await res.json()
      get().addToast(`백업이 생성되었습니다: ${data.filename}`, 'success')
    } catch (e) {
      get().addToast(e.message, 'error')
    }
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
             String(s.studentId).includes(q) ||
             String(s.grade).includes(q)
    })
  },
}))
