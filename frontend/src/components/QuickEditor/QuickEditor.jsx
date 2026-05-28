import { useState, useEffect, useRef } from 'react'
import { X, Save, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { COUNSELING_TYPES, SHEET_TYPES } from '@/data/mockData'
import DateInput from '@/components/ui/DateInput'
import { isValidYYYYMMDD } from '@/utils/dateHelper'

export default function QuickEditor({ width }) {
  const {
    editorOpen, setEditorOpen, editorMode,
    selectedStudent, selectedSession,
    addSession, updateSession, addToast,
    saveState, isContinuousEntry, setContinuousEntry,
    validationOptions,
  } = useAppStore()

  const dateRef = useRef(null)
  const sheetTypeRef = useRef(null)
  const typeRef = useRef(null)
  const summaryRef = useRef(null)
  const detailRef = useRef(null)

  const handleEnterKey = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef?.current?.focus()
    }
  }

  const [form, setForm] = useState({
    type: '',
    sheetType: '개인상담',
    summary: '',
    detail: '',
    date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
  })

  // 유효성 검사 에러 상태 추가
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editorOpen) {
      // 폼 리셋 시 에러 상태 초기화
      setErrors({})

      if (editorMode === 'edit' && selectedSession) {
        setForm({
          type: selectedSession.type || '',
          sheetType: selectedSession.sheetType || '개인상담',
          summary: selectedSession.summary || '',
          detail: selectedSession.detail || '',
          date: selectedSession.date || '',
        })
        // 수정 모드 진입 시 제목 필드 포커스
        setTimeout(() => summaryRef.current?.focus(), 100)
      } else {
        if (isContinuousEntry) {
          // 연속 입력 모드: 날짜, 시트구분, 상담구분 유지 / 제목, 내용만 초기화
          setForm(f => ({
            ...f,
            summary: '',
            detail: '',
          }))
          // 연속 입력 시 다음 학생 제목으로 포커스
          setTimeout(() => summaryRef.current?.focus(), 100)
        } else {
          setForm({
            type: '',
            sheetType: '개인상담',
            summary: '',
            detail: '',
            date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
          })
          // 일반 새 상담 시 날짜로 포커스
          setTimeout(() => dateRef.current?.focus(), 100)
        }
      }
    }
  }, [editorMode, selectedSession, editorOpen, selectedStudent?.id])

  const handleSave = async () => {
    if (saveState === 'saving') return

    const newErrors = {}
    if (!isValidYYYYMMDD(form.date)) {
      newErrors.date = true
    }
    if (!form.type) {
      newErrors.type = true
    }
    if (!form.summary) {
      newErrors.summary = true
    }
    if (!form.detail) {
      newErrors.detail = true
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)

      // 첫 에러 발생 필드로 포커스 이동 및 Toast 알림 출력
      if (newErrors.date) {
        dateRef.current?.focus()
        addToast('상담일자를 YYYYMMDD 형식의 8자리 숫자로 입력해 주세요.', 'error')
      } else if (newErrors.type) {
        typeRef.current?.focus()
        addToast('상담 구분을 선택해 주세요.', 'error')
      } else if (newErrors.summary) {
        summaryRef.current?.focus()
        addToast('상담 제목을 입력해 주세요.', 'error')
      } else if (newErrors.detail) {
        detailRef.current?.focus()
        addToast('상담 상세 내용을 입력해 주세요.', 'error')
      }
      return
    }

    setErrors({})
    try {
      if (editorMode === 'edit' && selectedSession) {
        await updateSession(selectedSession.id, form)
      } else {
        await addSession(form)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 전역 단축키 등록 (Ctrl+S 저장, Escape 닫기)
  useEffect(() => {
    if (!editorOpen) return
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        if (saveState !== 'saving') {
          setEditorOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [editorOpen, form, editorMode, selectedSession, saveState, errors])

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape' && saveState !== 'saving') {
      setEditorOpen(false)
    }
  }

  if (!editorOpen || !selectedStudent) return null

  return (
    <div
      className="flex flex-col h-full shrink-0"
      style={{
        width: width ? `${width}px` : undefined,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-2px 0 12px rgba(66,96,140,0.06)',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {editorMode === 'new' ? '새 상담 기록' : '상담 기록 수정'}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {selectedStudent.name} · Ctrl+S 저장
          </p>
        </div>
        <button
          onClick={() => saveState !== 'saving' && setEditorOpen(false)}
          disabled={saveState === 'saving'}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            saveState === 'saving' ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { if (saveState !== 'saving') e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { if (saveState !== 'saving') e.currentTarget.style.background = 'transparent' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 상담일자 */}
        <FormField label="상담일자" required>
          <DateInput
            inputRef={dateRef}
            onKeyDown={e => handleEnterKey(e, sheetTypeRef)}
            value={form.date}
            disabled={saveState === 'saving'}
            error={errors.date}
            onChange={val => {
              setForm(f => ({ ...f, date: val }))
              if (errors.date) setErrors(errs => ({ ...errs, date: false }))
            }}
          />
        </FormField>

        {/* 상담 시트 */}
        <FormField label="상담 시트">
          <Select
            selectRef={sheetTypeRef}
            onKeyDown={e => handleEnterKey(e, typeRef)}
            value={form.sheetType}
            disabled={saveState === 'saving'}
            onChange={v => setForm(f => ({ ...f, sheetType: v }))}
            options={SHEET_TYPES.filter(t => t !== '집단상담')}
          />
        </FormField>

        {/* 상담 구분 */}
        {(() => {
          const SHEET_NAME_MAP = {
            '개인상담': '개인상담',
            '집단상담': '집단상담(또래상담, 학급별 집단)',
            '보호자상담': '보호자상담',
            '교원자문': '교원자문',
            '의뢰': '의뢰(정서행동의뢰, 자문의 의뢰 등)'
          }
          const activeSheetType = form.sheetType || '개인상담'
          const formalSheetType = SHEET_NAME_MAP[activeSheetType] || activeSheetType
          const optionsData = validationOptions?.[formalSheetType]
          const activeOptions = optionsData?.options || COUNSELING_TYPES
          const isExcelSynced = optionsData?.source === 'excel'
          
          return (
            <FormField 
              label={
                <span className="flex items-center justify-between w-full">
                  <span>상담 구분</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-tight leading-none transition-all ${
                    isExcelSynced 
                      ? 'bg-green-50 text-green-600 border border-green-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {isExcelSynced ? '엑셀 연동됨' : '기본설정'}
                  </span>
                </span>
              } 
              required
            >
              <Select
                selectRef={typeRef}
                onKeyDown={e => handleEnterKey(e, summaryRef)}
                value={form.type}
                disabled={saveState === 'saving'}
                error={errors.type}
                onChange={v => {
                  setForm(f => ({ ...f, type: v }))
                  if (errors.type) setErrors(errs => ({ ...errs, type: false }))
                  if (v) {
                    // 상담구분 선택 시 제목 필드로 즉시 포커스 이동
                    setTimeout(() => summaryRef.current?.focus(), 50)
                  }
                }}
                options={activeOptions}
                placeholder="구분 선택..."
              />
            </FormField>
          )
        })()}

        {/* 상담 제목 */}
        <FormField label="상담 제목" required>
          <input
            ref={summaryRef}
            onKeyDown={e => handleEnterKey(e, detailRef)}
            type="text"
            value={form.summary}
            disabled={saveState === 'saving'}
            onChange={e => {
              setForm(f => ({ ...f, summary: e.target.value }))
              if (errors.summary) setErrors(errs => ({ ...errs, summary: false }))
            }}
            placeholder="한 줄 요약..."
            className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${
              saveState === 'saving' ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{
              background: 'var(--bg-primary)',
              border: errors.summary ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = errors.summary ? 'var(--red)' : 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = errors.summary ? 'var(--red)' : 'var(--border)'}
          />
        </FormField>

        {/* 상담 내용 */}
        <FormField label="상담 내용 (상세)" required>
          <textarea
            ref={detailRef}
            value={form.detail}
            disabled={saveState === 'saving'}
            onChange={e => {
              setForm(f => ({ ...f, detail: e.target.value }))
              if (errors.detail) setErrors(errs => ({ ...errs, detail: false }))
            }}
            placeholder="상담 내용을 입력하세요..."
            rows={8}
            className={`w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all leading-relaxed ${
              saveState === 'saving' ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{
              background: 'var(--bg-primary)',
              border: errors.detail ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = errors.detail ? 'var(--red)' : 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = errors.detail ? 'var(--red)' : 'var(--border)'}
          />
        </FormField>

        {/* 연속 입력 모드 */}
        {editorMode === 'new' && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-dashed transition-all"
            style={{ 
              background: isContinuousEntry ? 'var(--accent-glow)' : 'var(--bg-primary)',
              borderColor: isContinuousEntry ? 'var(--accent)' : 'var(--border)'
            }}>
            <div>
              <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                연속 입력 모드
              </span>
              <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                저장 시 목록의 다음 학생으로 바로 전환됩니다.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isContinuousEntry}
              disabled={saveState === 'saving'}
              onChange={e => setContinuousEntry(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-accent"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div
        className="px-4 py-3 flex gap-2 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setEditorOpen(false)}
          disabled={saveState === 'saving'}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            saveState === 'saving' ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          style={{
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            border: '1.5px solid var(--border)',
          }}
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            saveState === 'saving' ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
          }`}
          style={{
            background: saveState === 'error' ? 'var(--red)' : 'var(--accent)',
            color: 'white',
            boxShadow: saveState === 'saving' ? 'none' : '0 2px 8px rgba(75,142,241,0.35)',
          }}
        >
          <Save size={14} />
          {saveState === 'saving' ? '저장 중...' : saveState === 'saved' ? '저장 완료!' : '저장'}
        </button>
      </div>
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: 'var(--red)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Select({ selectRef, onKeyDown, value, onChange, options, placeholder, disabled, error }) {
  return (
    <div className="relative">
      <select
        ref={selectRef}
        onKeyDown={onKeyDown}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-xl text-sm outline-none appearance-none transition-all pr-8 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        style={{
          background: 'var(--bg-primary)',
          border: error ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
      >
        {placeholder && <option value="" style={{ color: 'var(--text-muted)' }}>{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }} />
    </div>
  )
}

