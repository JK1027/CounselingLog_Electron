import { sessionService } from '@/services/sessionService'
import { studentService } from '@/services/studentService'

export const createSessionSlice = (set, get) => ({
  sessions: [],
  groupSessions: [],
  peerSessions: [],
  selectedSession: null,
  setSelectedSession: (session) => set({ selectedSession: session }),

  todayStats: { total: 0, pending: 0, guardian: 0, referral: 0 },

  // 데이터 유효성 검사 (드롭다운 옵션) 맵 초기값
  validationOptions: {
    "개인상담": {
      "source": "fallback",
      "options": ['학업', '진로', '성격', '성', '대인관계', '가정 및 가족관계', '일탈 및 비행', '학교폭력 가해', '학교폭력 피해', '자해 및 자살', '정신건강', '컴퓨터 및 스마트폰 과사용', '정보제공', '기타']
    },
    "집단상담(또래상담, 학급별 집단)": {
      "source": "fallback",
      "options": ['정신건강', '진로', '학업', '대인관계', '기타']
    },
    "보호자상담": {
      "source": "fallback",
      "options": ["학생관련상담", "교사관련상담", "학습", "기타"]
    },
    "교원자문": {
      "source": "fallback",
      "options": ["학교학습", "사회성발달", "정서발달", "진로발달", "행동발달", "기타"]
    },
    "의뢰(정서행동의뢰, 자문의 의뢰 등)": {
      "source": "fallback",
      "options": ["외부전문가에게 상담의뢰", "교내 교사에게 상담의뢰", "기타"]
    }
  },

  // 엑셀 유효성 검사 드롭박스 옵션 조회
  fetchValidationOptions: async () => {
    try {
      const data = await sessionService.getValidationOptions()
      set({ validationOptions: data })
    } catch (e) {
      console.error('Failed to fetch validation options, keeping defaults', e)
    }
  },

  // 엑셀 유효성 검사 드롭박스 옵션 수동 재파싱 및 리로드
  reloadValidationOptions: async () => {
    try {
      const data = await sessionService.reloadValidationOptions()
      set({ validationOptions: data })
      get().addToast('엑셀 데이터 유효성 검사 설정을 새로고침했습니다.', 'success')
    } catch (e) {
      get().addToast(`유효성 검사 새로고침 실패: ${e.message}`, 'error')
    }
  },

  // ─── API 초기화 ────────────────────────────────────────────────────────
  initialize: async () => {
    try {
      // 서버 건강상태 및 현재 파일 경로 조회
      try {
        const healthData = await studentService.getHealth()
        set({ currentFilePath: healthData.excel_path })
      } catch (e) {
        console.warn('Health check failed', e)
      }

      const studentsData = await studentService.getStudents()
      const statsData = await studentService.getTodayStats()

      // 엑셀 유효성 검사 드롭박스 동기화
      await get().fetchValidationOptions()

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
      const data = await sessionService.getSessions(student.name, student.studentId)
      set({ sessions: data })
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 집단상담 이력 로드 ──────────────────────────────────────────
  loadGroupSessions: async () => {
    try {
      const data = await sessionService.getSessionsBySheetType('집단상담')
      // 집단상담 대장: 또래상담 제외
      const groupOnly = data.filter(s => !s.programName?.includes('또래상담') && !s.summary?.includes('또래상담'))
      set({ groupSessions: groupOnly })
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 또래상담 이력 로드 ──────────────────────────────────────────
  loadPeerSessions: async () => {
    try {
      const data = await sessionService.getSessionsBySheetType('집단상담')
      // 또래상담 대장: 또래상담만 포함
      const peerOnly = data.filter(s => s.programName?.includes('또래상담') || s.summary?.includes('또래상담'))
      set({ peerSessions: peerOnly })
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 세션 저장 ─────────────────────────────────────────────────────────
  addSession: async (formData) => {
    const { selectedStudent } = get()
    if (!selectedStudent) return

    set({ saveState: 'saving' })
    try {
      await sessionService.addSession(selectedStudent, formData)
      
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

      // Reload students and todayStats
      await get().initialize()
      
      const { isContinuousEntry } = get()
      if (isContinuousEntry) {
        const filtered = get().getFilteredStudents()
        const currentIndex = filtered.findIndex(
          s => s.name === selectedStudent.name && s.studentId === selectedStudent.studentId
        )
        if (currentIndex >= 0 && currentIndex < filtered.length - 1) {
          const nextStudent = filtered[currentIndex + 1]
          set({ selectedStudent: nextStudent })
          await get().loadSessions(nextStudent)
          set({ editorOpen: true, editorMode: 'new' })
          get().addToast(`${selectedStudent.name} 학생의 새 상담 기록이 저장되었습니다. 연속 입력 모드로 다음 학생(${nextStudent.name})으로 이동합니다.`, 'success')
          return
        } else {
          get().addToast(`${selectedStudent.name} 학생의 새 상담 기록이 저장되었습니다. 마지막 학생입니다.`, 'success')
        }
      }
      
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
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
    }
  },

  // ─── 세션 수정 ─────────────────────────────────────────────────────────
  updateSession: async (sessionId, formData) => {
    const { selectedStudent } = get()
    set({ saveState: 'saving' })
    try {
      await sessionService.updateSession(sessionId, formData)
      
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

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
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
    }
  },

  // ─── 세션 삭제 ─────────────────────────────────────────────────────────
  deleteSession: async (sessionId) => {
    const { selectedStudent } = get()
    set({ saveState: 'saving' })
    try {
      await sessionService.deleteSession(sessionId)
      
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

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
          await get().loadSessions(updatedStudent)
        } else {
          // 상담 일지가 모두 삭제되어 학생 목록에서 사라진 경우
          set({ selectedStudent: null, sessions: [] })
        }
      }
      
      get().addToast('상담 기록이 삭제되었습니다.', 'success')
    } catch (e) {
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
    }
  },

  // ─── 집단상담 저장 ───────────────────────────────────────────────────
  addGroupSession: async (formData) => {
    set({ saveState: 'saving' })
    try {
      await sessionService.addGroupSession(formData)
      
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

      await get().initialize()
      await get().loadGroupSessions()
      await get().loadPeerSessions()
      get().addToast('새 집단상담 기록이 저장되었습니다.', 'success')
    } catch (e) {
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
    }
  },

  // ─── 집단상담 수정 ───────────────────────────────────────────────────
  updateGroupSession: async (sessionId, formData) => {
    set({ saveState: 'saving' })
    try {
      await sessionService.updateGroupSession(sessionId, formData)
      
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

      await get().initialize()
      await get().loadGroupSessions()
      await get().loadPeerSessions()
      get().addToast('집단상담 기록이 수정되었습니다.', 'success')
    } catch (e) {
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
    }
  },

  // ─── 집단상담 삭제 ───────────────────────────────────────────────────
  deleteGroupSession: async (sessionId) => {
    set({ saveState: 'saving' })
    try {
      await sessionService.deleteSession(sessionId) // 백엔드 입장에선 ID기반 삭제이므로 deleteSession 호출
      
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

      await get().initialize()
      await get().loadGroupSessions()
      await get().loadPeerSessions()
      get().addToast('집단상담 기록이 삭제되었습니다.', 'success')
    } catch (e) {
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
    }
  }
})
