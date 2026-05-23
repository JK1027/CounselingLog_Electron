import { create } from 'zustand'
import { getChosung } from '@/utils/hangul'

const API_BASE = 'http://localhost:8765'

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const controller = new AbortController()
  
  // 쓰기 작업(POST, PUT, DELETE) 및 백업(/backup) 등의 요청은 20초(20000ms), 일반 조회 등은 8초(8000ms) 적용
  const isWriteOrBackup = 
    options.method === 'POST' || 
    options.method === 'PUT' || 
    options.method === 'DELETE' || 
    endpoint.includes('/backup')

  const timeoutMs = isWriteOrBackup ? 20000 : 8000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMsg = `API 요청 실패 (상태 코드: ${response.status})`
      try {
        const errData = await response.json()
        if (errData && errData.detail) {
          errorMsg = errData.detail
        }
      } catch (_) {
        // JSON parsing failed or detail not found
      }
      throw new Error(errorMsg)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 서버 상태를 확인해 주세요.')
    }
    throw error
  }
}

export const useAppStore = create((set, get) => ({
  // 자동 업데이트 관련 상태
  appVersion: 'v0.1.0',
  updateStatus: 'idle', // 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  downloadPercent: 0,
  newVersionInfo: null,
  updateErrorMessage: '',

  setAppVersion: (ver) => set({ appVersion: ver }),
  setUpdateStatus: (status) => set({ updateStatus: status }),
  setDownloadPercent: (percent) => set({ downloadPercent: percent }),
  setNewVersionInfo: (info) => set({ newVersionInfo: info }),
  setUpdateErrorMessage: (msg) => set({ updateErrorMessage: msg }),

  // 현재 활성화된 엑셀 파일 경로
  currentFilePath: '',

  // 학생 목록
  students: [],

  // 오늘 대시보드 통계
  todayStats: { total: 0, pending: 0, guardian: 0, referral: 0 },

  // 학급 필터 상태
  selectedGradeFilter: '',
  selectedBanFilter: '',
  setGradeFilter: (grade) => set({ selectedGradeFilter: grade, selectedBanFilter: '' }),
  setBanFilter: (ban) => set({ selectedBanFilter: ban }),

  // 저장 안정성 UX 상태
  saveState: 'idle', // 'idle' | 'saving' | 'saved' | 'error'

  // 연속 입력 모드 상태
  isContinuousEntry: false,
  setContinuousEntry: (val) => set({ isContinuousEntry: val }),

  // 컴팩트 모드 상태
  isCompactMode: localStorage.getItem('counseling_compact_mode') === 'true',
  toggleCompactMode: () => set(state => {
    const next = !state.isCompactMode
    localStorage.setItem('counseling_compact_mode', String(next))
    return { isCompactMode: next }
  }),

  // Toast 목록
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now()
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))
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
  registerOpen: false,
  setRegisterOpen: (open) => set({ registerOpen: open }),

  // Quick Editor 패널 열림 여부
  editorOpen: false,
  setEditorOpen: (open) => set({ editorOpen: open }),

  // 편집 모드 (new | edit)
  editorMode: 'new',
  setEditorMode: (mode) => set({ editorMode: mode }),

  // ─── API 초기화 ────────────────────────────────────────────────────────
  initialize: async () => {
    try {
      // 서버 건강상태 및 현재 파일 경로 조회
      try {
        const resHealth = await apiFetch('/health')
        const healthData = await resHealth.json()
        set({ currentFilePath: healthData.excel_path })
      } catch (e) {
        console.warn('Health check failed', e)
      }

      const resStudents = await apiFetch('/students')
      const studentsData = await resStudents.json()

      const resStats = await apiFetch('/stats/today')
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
      const res = await apiFetch(`/sessions/${encodeURIComponent(student.name)}?student_id=${encodeURIComponent(student.studentId || '')}`)
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
      registerOpen: false,
      editorOpen: true,
      editorMode: 'new'
    }))
    
    get().addToast(`${name} 학생이 신규 등록되었습니다. 상담을 입력해 주세요.`, 'success')
  },

  // ─── 세션 저장 ─────────────────────────────────────────────────────────
  addSession: async (formData) => {
    const { selectedStudent } = get()
    if (!selectedStudent) return

    set({ saveState: 'saving' })
    try {
      await apiFetch('/sessions', {
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
      await apiFetch(`/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData
        })
      })
      
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
      await apiFetch(`/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
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

  // ─── 수동 백업 ─────────────────────────────────────────────────────────
  triggerBackup: async () => {
    try {
      const res = await apiFetch('/backup', { method: 'POST' })
      const data = await res.json()
      get().addToast(`백업이 생성되었습니다: ${data.filename}`, 'success')
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // ─── 엑셀 파일 경로 선택 및 불러오기 ────────────────────────────────────
  openFileByPath: async (filePath) => {
    try {
      const res = await apiFetch('/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      })
      const data = await res.json()
      set({ 
        currentFilePath: data.excel_path,
        selectedStudent: null,
        sessions: []
      })
      
      // 데이터 리로드
      await get().initialize()
      get().addToast(`상담일지를 불러왔습니다: ${filePath.split(/[\\/]/).pop()}`, 'success')
    } catch (e) {
      get().addToast(e.message, 'error')
    }
  },

  // 필터된 학생 목록
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
  },

  // ─── 자동 업데이트 이벤트 초기 바인딩 및 관리 ──────────────────────────
  initializeUpdater: () => {
    // 1. 현재 앱 버전 조회
    if (window.electronAPI && window.electronAPI.getVersion) {
      window.electronAPI.getVersion().then(v => set({ appVersion: `v${v}` }))
    }

    // 2. 일렉트론 메인 프로세스 업데이트 이벤트 구독
    if (window.updaterAPI) {
      const unsubAvailable = window.updaterAPI.onUpdateAvailable((info) => {
        set({ newVersionInfo: info, updateStatus: 'available' })
      })
      const unsubNotAvailable = window.updaterAPI.onUpdateNotAvailable(() => {
        set({ updateStatus: 'not-available' })
        setTimeout(() => set({ updateStatus: 'idle' }), 3000)
      })
      const unsubProgress = window.updaterAPI.onDownloadProgress((percent) => {
        set({ downloadPercent: Math.round(percent), updateStatus: 'downloading' })
      })
      const unsubDownloaded = window.updaterAPI.onUpdateDownloaded(() => {
        set({ updateStatus: 'downloaded' })
      })
      const unsubError = (err) => {
        console.error('Update error:', err)
        set({ updateErrorMessage: err || '업데이트 오류', updateStatus: 'error' })
        setTimeout(() => set({ updateStatus: 'idle' }), 5000)
      }
      const unsubErrorFn = window.updaterAPI.onUpdateError(unsubError)

      // 구독 해제용 헬퍼 반환
      return () => {
        unsubAvailable()
        unsubNotAvailable()
        unsubProgress()
        unsubDownloaded()
        unsubErrorFn()
      }
    }
    return () => {}
  },
}))
