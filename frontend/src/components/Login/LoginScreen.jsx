import { useState, useEffect, useRef } from 'react'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function LoginScreen() {
  const { submitLogin, addToast } = useAppStore()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [errorState, setErrorState] = useState(false)
  const inputRef = useRef(null)

  // 컴포넌트 마운트 시 흔들림(shake) 애니메이션용 커스텀 CSS 주입
  useEffect(() => {
    const cssId = 'login-screen-shake-css'
    if (!document.getElementById(cssId)) {
      const style = document.createElement('style')
      style.id = cssId
      style.innerHTML = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-6px); }
          30%, 60% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `
      document.head.appendChild(style)
    }
    
    // 마운트 시 즉각 비밀번호 입력창에 포커스 배정
    inputRef.current?.focus()
  }, [])

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!password.trim() || loading) return

    setLoading(true)
    setErrorState(false)

    // 약간의 딜레이를 주어 부드러운 로딩 UX 구현
    const success = await new Promise((resolve) => {
      setTimeout(async () => {
        const isMatched = await submitLogin(password.trim())
        resolve(isMatched)
      }, 300)
    })

    setLoading(false)

    if (success) {
      addToast('인증되었습니다. 반갑습니다!', 'success')
    } else {
      setShake(true)
      setErrorState(true)
      addToast('비밀번호가 올바르지 않습니다.', 'error')
      // 흔들림 애니메이션 리셋을 위한 타이머
      setTimeout(() => {
        setShake(false)
      }, 400)
      
      // 재입력을 유용하게 하기 위한 포커스 및 텍스트 선택
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }

  return (
    <div
      className="w-screen h-screen fixed inset-0 flex items-center justify-center select-none z-[9999]"
      style={{
        background: 'radial-gradient(circle, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      }}
    >
      <div
        className={`w-[360px] p-8 rounded-2xl border shadow-xl transition-all ${
          shake ? 'animate-shake' : ''
        }`}
        style={{
          background: 'var(--bg-card)',
          borderColor: errorState ? 'var(--red)' : 'var(--border)',
          boxShadow: '0 8px 30px rgba(66,96,140,0.08)',
        }}
      >
        {/* 상단 락 아이콘 및 제목 */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors duration-300"
            style={{
              background: errorState ? 'var(--red-soft)' : 'var(--accent-glow)',
              color: errorState ? 'var(--red)' : 'var(--accent)',
            }}
          >
            <Lock size={20} />
          </div>
          <h2
            className="text-base font-extrabold"
            style={{ color: 'var(--text-primary)' }}
          >
            상담기록 관리 시스템
          </h2>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            안전한 조회를 위해 비밀번호를 입력해 주세요.
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errorState) setErrorState(false)
              }}
              disabled={loading}
              placeholder="보안 암호 입력"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl text-xs outline-none font-medium transition-all"
              style={{
                background: 'var(--bg-primary)',
                border: errorState ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errorState ? 'var(--red)' : 'var(--accent)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errorState ? 'var(--red)' : 'var(--border)'
              }}
            />
            {/* 비밀번호 표시 토글 눈 버튼 */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover active:scale-95 transition-all text-neutral-400"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loading || !password.trim()
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90 active:scale-[0.98]'
            }`}
            style={{
              background: errorState ? 'var(--red)' : 'var(--accent)',
              boxShadow: loading || !password.trim() ? 'none' : '0 4px 12px rgba(75,142,241,0.25)',
            }}
          >
            {loading ? '인증 확인 중...' : '잠금 해제'}
            {!loading && <ArrowRight size={13} />}
          </button>
        </form>
      </div>
    </div>
  )
}
