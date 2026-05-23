import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function useGlobalShortcuts() {
  const { initialize, openFileByPath } = useAppStore()

  useEffect(() => {
    // 최초 데이터 로드 초기화
    initialize()

    // 일렉트론 메뉴바 파일 열기 연동 수신
    let unsubscribe = null
    if (window.electronAPI && window.electronAPI.onFileOpened) {
      unsubscribe = window.electronAPI.onFileOpened((filePath) => {
        if (filePath) {
          openFileByPath(filePath)
        }
      })
    }

    // 전역 단축키 이벤트 리스너
    const handleKeyDown = (e) => {
      // 1. Ctrl + N: 새 상담 작성 패널 호출 (학생 선택 필수)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        const store = useAppStore.getState()
        if (store.selectedStudent) {
          store.setEditorMode('new')
          store.setEditorOpen(true)
        } else {
          store.addToast('상담을 입력할 학생을 먼저 선택해 주세요.', 'error')
        }
      }

      // 2. Alt + ArrowUp: 목록 내 이전 학생 빠른 선택 이동
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        const store = useAppStore.getState()
        const filtered = store.getFilteredStudents()
        if (filtered.length > 0) {
          const currentIndex = filtered.findIndex(s => s.id === store.selectedStudent?.id)
          if (currentIndex > 0) {
            store.setSelectedStudent(filtered[currentIndex - 1])
          }
        }
      }

      // 3. Alt + ArrowDown: 목록 내 다음 학생 빠른 선택 이동
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault()
        const store = useAppStore.getState()
        const filtered = store.getFilteredStudents()
        if (filtered.length > 0) {
          const currentIndex = filtered.findIndex(s => s.id === store.selectedStudent?.id)
          if (currentIndex >= 0 && currentIndex < filtered.length - 1) {
            store.setSelectedStudent(filtered[currentIndex + 1])
          } else if (currentIndex === -1) {
            store.setSelectedStudent(filtered[0])
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (unsubscribe) unsubscribe()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [initialize, openFileByPath])
}
