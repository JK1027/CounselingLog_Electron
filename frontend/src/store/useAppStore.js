import { create } from 'zustand'
import { createAuthSlice } from './slices/authSlice'
import { createUiSlice } from './slices/uiSlice'
import { createStudentSlice } from './slices/studentSlice'
import { createSessionSlice } from './slices/sessionSlice'
import { createSettingsSlice } from './slices/settingsSlice'

export const useAppStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createUiSlice(...a),
  ...createStudentSlice(...a),
  ...createSessionSlice(...a),
  ...createSettingsSlice(...a)
}))
