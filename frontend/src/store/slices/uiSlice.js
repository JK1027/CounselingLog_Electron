export const createUiSlice = (set, get) => ({
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

  // Command Palette 및 등록 모달 열림 여부
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

  // 저장 안정성 UX 상태
  saveState: 'idle', // 'idle' | 'saving' | 'saved' | 'error'

  // 연속 입력 모드 상태
  isContinuousEntry: false,
  setContinuousEntry: (val) => set({ isContinuousEntry: val })
})
