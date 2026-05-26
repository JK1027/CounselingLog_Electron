import { useRef } from 'react'
import { Calendar } from 'lucide-react'
import { cleanDateString, getTodayDateString } from '@/utils/dateHelper'

export default function DateInput({
  inputRef,
  value,
  onChange,
  onKeyDown,
  disabled,
  error,
  placeholder = 'YYYYMMDD'
}) {
  const pickerRef = useRef(null)
  const localInputRef = useRef(null)
  
  // 외부 ref가 주어지면 그것을 쓰고, 없으면 내부 ref를 사용
  const mainInputRef = inputRef || localInputRef

  // YYYYMMDD를 YYYY-MM-DD 형태로 포맷팅하여 네이티브 date picker value에 전달
  const getPickerValue = (val) => {
    if (val && val.length === 8) {
      return `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`
    }
    return ''
  }

  const handleTextChange = (e) => {
    const cleaned = cleanDateString(e.target.value)
    onChange(cleaned)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const cleaned = cleanDateString(pastedText)
    onChange(cleaned)
  }

  const handlePickerChange = (e) => {
    const rawVal = e.target.value // YYYY-MM-DD 포맷
    if (rawVal) {
      const formatted = rawVal.replace(/-/g, '')
      onChange(formatted)
    }
    
    // 달력을 닫은 뒤 텍스트 입력창으로 포커스를 복구하여 Enter 키 또는 Tab 흐름 유지
    setTimeout(() => {
      mainInputRef.current?.focus()
    }, 50)
  }

  const handleKeyDownLocal = (e) => {
    // IME(한글 입력 조합 상태)에서는 단축키 발동 차단 (중복 방지)
    if (e.nativeEvent.isComposing) return

    const key = e.key.toLowerCase()

    // t 또는 . 누르면 오늘 날짜 자동 완성
    if (key === 't' || key === '.') {
      e.preventDefault()
      const today = getTodayDateString()
      onChange(today)
      return
    }

    // 기존 폼 입력 제어 (Enter 키 전달 등)
    if (onKeyDown) {
      onKeyDown(e)
    }
  }

  const triggerPicker = () => {
    if (disabled) return
    if (pickerRef.current) {
      // Electron/Chromium 버전 대응을 위한 fallback 검사
      if (pickerRef.current.showPicker) {
        pickerRef.current.showPicker()
      } else {
        pickerRef.current.click()
      }
    }
  }

  return (
    <div className="relative w-full flex items-center">
      {/* 텍스트 입력창 */}
      <input
        ref={mainInputRef}
        type="text"
        maxLength={8}
        value={value}
        onChange={handleTextChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDownLocal}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full pl-3 pr-10 py-2 rounded-xl text-sm outline-none transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        style={{
          background: 'var(--bg-primary)',
          border: error ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
      />

      {/* 달력 아이콘 버튼 */}
      <button
        type="button"
        tabIndex={-1}
        onClick={triggerPicker}
        disabled={disabled}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-hover active:scale-95'
        }`}
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'transparent' }}
      >
        <Calendar size={15} />
      </button>

      {/* 숨겨진 네이티브 데이트 피커 */}
      <input
        ref={pickerRef}
        type="date"
        value={getPickerValue(value)}
        onChange={handlePickerChange}
        tabIndex={-1}
        className="absolute pointer-events-none opacity-0"
        style={{
          width: 0,
          height: 0,
          right: '14px',
          bottom: 0,
        }}
      />
    </div>
  )
}
