import { studentService } from '@/services/studentService'
import { getChosung } from '@/utils/hangul'

export const createStudentSlice = (set, get) => ({
  students: [],
  peerStudents: [],

  // 학급 필터 상태
  selectedGradeFilter: '',
  selectedBanFilter: '',
  setGradeFilter: (grade) => set({ selectedGradeFilter: grade, selectedBanFilter: '' }),
  setBanFilter: (ban) => set({ selectedBanFilter: ban }),

  // 검색어
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // 선택된 학생
  selectedStudent: null,
  setSelectedStudent: async (student) => {
    set({ selectedStudent: student })
    if (student?.isGroupTab) {
      await get().loadGroupSessions()
    } else {
      await get().loadSessions(student)
    }
  },

  // 또래상담 학생 명단 로드
  loadPeerStudents: async () => {
    try {
      const data = await studentService.getPeerStudents()
      set({ peerStudents: data })
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // 또래상담 학생 명단 저장
  savePeerStudents: async (studentsList) => {
    set({ saveState: 'saving' })
    try {
      await studentService.savePeerStudents(studentsList)
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)
      
      set({ peerStudents: studentsList })
      get().addToast('또래상담 학생 명단이 저장되었습니다.', 'success')
    } catch (e) {
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
    }
  },

  // 신규 가상 학생 등록 (QuickEditor 실행 전)
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
      registerOpen: false,
      editorOpen: true,
      editorMode: 'new'
    }))
    
    get().addToast(`${name} 학생이 신규 등록되었습니다. 상담을 입력해 주세요.`, 'success')
  },

  // 학생 정보 수정
  updateStudentInfo: async (oldName, oldStudentId, studentData) => {
    set({ saveState: 'saving' })
    try {
      await studentService.updateStudentInfo(oldName, oldStudentId, studentData)
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

      // 전체 학생 목록 및 통계 새로고침
      await get().initialize()

      // 선택된 학생의 정보 갱신 및 세션 리로드
      const newStudents = get().students
      const updatedStudent = newStudents.find(
        s => s.name === studentData.name && s.studentId === studentData.studentId
      )
      if (updatedStudent) {
        set({ selectedStudent: updatedStudent })
        await get().loadSessions(updatedStudent)
      } else {
        set({ selectedStudent: null, sessions: [] })
      }
      
      get().addToast('학생 정보가 수정되었습니다.', 'success')
    } catch (e) {
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
      throw e
    }
  },

  // 학생 정보 및 상담 이력 삭제
  deleteStudent: async (name, studentId) => {
    set({ saveState: 'saving' })
    try {
      await studentService.deleteStudent(name, studentId)
      set({ saveState: 'saved' })
      setTimeout(() => set({ saveState: 'idle' }), 3000)

      // 전체 학생 목록 및 통계 새로고침
      await get().initialize()

      // 선택된 학생이 본인일 경우 선택 해제
      const { selectedStudent } = get()
      if (selectedStudent && selectedStudent.name === name && selectedStudent.studentId === studentId) {
        set({ selectedStudent: null, sessions: [] })
      }
      
      get().addToast(`${name} 학생의 모든 정보가 삭제되었습니다.`, 'success')
    } catch (e) {
      set({ saveState: 'error' })
      get().addToast(e.message, 'error')
      throw e
    }
  },

  // 필터된 학생 목록 계산
  getFilteredStudents: () => {
    const { students, searchQuery, selectedGradeFilter, selectedBanFilter } = get()
    let result = students

    // 학년 필터 적용
    if (selectedGradeFilter) {
      result = result.filter(s => s.grade === selectedGradeFilter)
    }

    // 반 필터 적용
    if (selectedBanFilter) {
      result = result.filter(s => s.ban === selectedBanFilter)
    }

    // 검색어 필터 적용
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => {
        const nameChosung = getChosung(s.name).toLowerCase()
        return s.name.toLowerCase().includes(q) ||
               nameChosung.includes(q) ||
               String(s.studentId).includes(q) ||
               String(s.grade).includes(q)
      })
    }

    return result
  }
})
