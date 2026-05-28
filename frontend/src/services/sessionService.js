import { apiFetch } from './apiClient'

export const sessionService = {
  // 엑셀 유효성 검사 드롭박스 옵션 조회
  getValidationOptions: async () => {
    const res = await apiFetch('/validation-options')
    return res.json()
  },

  // 유효성 검사 강제 새로고침
  reloadValidationOptions: async () => {
    const res = await apiFetch('/validation-options/reload', { method: 'POST' })
    return res.json()
  },

  // 특정 학생 상담 이력 로드
  getSessions: async (name, studentId = '') => {
    const res = await apiFetch(`/sessions/${encodeURIComponent(name)}?student_id=${encodeURIComponent(studentId)}`)
    return res.json()
  },

  // 집단상담 또는 특정 시트의 세션 로드
  getSessionsBySheetType: async (sheetType) => {
    const res = await apiFetch(`/sessions?sheet_type=${encodeURIComponent(sheetType)}`)
    return res.json()
  },

  // 일반 세션 추가
  addSession: async (student, formData) => {
    const res = await apiFetch('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: student.name,
        studentId: student.studentId,
        grade: student.grade,
        gender: student.gender,
        ...formData
      })
    })
    return res.json()
  },

  // 일반 세션 수정
  updateSession: async (sessionId, formData) => {
    const res = await apiFetch(`/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData
      })
    })
    return res.json()
  },

  // 세션 삭제
  deleteSession: async (sessionId) => {
    const res = await apiFetch(`/sessions/${sessionId}`, {
      method: 'DELETE'
    })
    return res.json()
  },

  // 집단상담 세션 추가
  addGroupSession: async (formData) => {
    const res = await apiFetch('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetType: '집단상담',
        ...formData
      })
    })
    return res.json()
  },

  // 집단상담 세션 수정
  updateGroupSession: async (sessionId, formData) => {
    const res = await apiFetch(`/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetType: '집단상담',
        ...formData
      })
    })
    return res.json()
  },

  // 수동 백업 트리거
  triggerBackup: async () => {
    const res = await apiFetch('/backup', { method: 'POST' })
    return res.json()
  }
}
