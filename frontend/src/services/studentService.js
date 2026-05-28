import { apiFetch } from './apiClient'

export const studentService = {
  // 서버 건강 상태 및 현재 파일 경로 조회
  getHealth: async () => {
    const res = await apiFetch('/health')
    return res.json()
  },

  // 전체 학생 목록 조회
  getStudents: async () => {
    const res = await apiFetch('/students')
    return res.json()
  },

  // 오늘 대시보드 통계 조회
  getTodayStats: async () => {
    const res = await apiFetch('/stats/today')
    return res.json()
  },

  // 또래상담 학생 목록 조회
  getPeerStudents: async () => {
    const res = await apiFetch('/peer-counsel/students')
    return res.json()
  },

  // 또래상담 학생 목록 저장
  savePeerStudents: async (studentsList) => {
    const res = await apiFetch('/peer-counsel/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentsList)
    })
    return res.json()
  },

  // 학생 정보 수정
  updateStudentInfo: async (oldName, oldStudentId, studentData) => {
    const res = await apiFetch('/students/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldName,
        oldStudentId,
        newName: studentData.name,
        newStudentId: studentData.studentId,
        grade: studentData.grade,
        gender: studentData.gender
      })
    })
    return res.json()
  },

  // 학생 정보 및 상담 이력 삭제
  deleteStudent: async (name, studentId) => {
    const res = await apiFetch('/students/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, studentId })
    })
    return res.json()
  },

  // 백엔드에 동적 백업 설정 갱신 요청
  syncSettings: async (dirPath) => {
    const res = await apiFetch('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupDir: dirPath })
    })
    return res.json()
  },

  // 백업 경로 권한 테스트
  testBackupPath: async (dirPath) => {
    const res = await apiFetch('/backup/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backup_dir: dirPath })
    })
    return res.json()
  },

  // 새로운 엑셀 파일 열기
  openFileByPath: async (filePath) => {
    const res = await apiFetch('/open-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    })
    return res.json()
  }
}
