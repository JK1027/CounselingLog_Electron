import { sha256 } from '@/utils/hashHelper'

export const createAuthSlice = (set, get) => ({
  // 보안 잠금 상태
  isAuthenticated: false,

  submitLogin: async (password) => {
    try {
      const hash = await sha256(password)
      const expectedHash = import.meta.env.VITE_APP_LOCK_PASSWORD_HASH
      
      if (!expectedHash) {
        console.error('VITE_APP_LOCK_PASSWORD_HASH가 .env에 정의되지 않았습니다.')
        get().addToast('비밀번호 환경 변수(.env)가 주입되지 않았습니다.', 'error')
        return false
      }

      const match = hash === expectedHash
      if (match) {
        set({ isAuthenticated: true })
      }
      return match
    } catch (e) {
      console.error('Password hash verify failed:', e)
      return false
    }
  }
})
