import { useState, useEffect, useRef } from 'react'
import { X, Save, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { COUNSELING_TYPES, SHEET_TYPES } from '@/data/mockData'

export default function QuickEditor() {
  const {
    editorOpen, setEditorOpen, editorMode,
    selectedStudent, selectedSession,
    addSession, updateSession, addToast,
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

  useEffect(() => {
    if (editorMode === 'edit' && selectedSession) {
      setForm({
        type: selectedSession.type || '',
        sheetType: selectedSession.sheetType || '개인상담',
        summary: selectedSession.summary || '',
        detail: selectedSession.detail || '',
        date: selectedSession.date || '',
      })
    } else {
      setForm({
        type: '',
        sheetType: '개인상담',
        summary: '',
        detail: '',
        date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      })
    }
  }, [editorMode, selectedSession, editorOpen])

  if (!editorOpen || !selectedStudent) return null

  const handleSave = () => {
    if (!form.date) {
      addToast('상담일자를 입력해 주세요.', 'error')
      return
    }
    if (form.date.length !== 8) {
      addToast('상담일자는 YYYYMMDD 형식의 8자리 숫자여야 합니다.', 'error')
      return
    }
    if (!form.type) {
      addToast('상담 구분을 선택해 주세요.', 'error')
      return
    }
    if (!form.summary) {
      addToast('상담 제목을 입력해 주세요.', 'error')
      return
    }
    if (!form.detail) {
      addToast('상담 상세 내용을 입력해 주세요.', 'error')
      return
    }
    if (editorMode === 'edit' && selectedSession) {
      updateSession(selectedSession.id, form)
    } else {
      addSession(form)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') setEditorOpen(false)
  }

  return (
    <div
      className="flex flex-col h-full w-80 shrink-0"
      style={{
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
          onClick={() => setEditorOpen(false)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={16} />
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 상담일자 */}
        <FormField label="상담일자" required>
          <input
            ref={dateRef}
            onKeyDown={e => handleEnterKey(e, sheetTypeRef)}
            type="text"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            placeholder="YYYYMMDD"
            maxLength={8}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </FormField>

        {/* 상담 시트 */}
        <FormField label="상담 시트">
          <Select
            selectRef={sheetTypeRef}
            onKeyDown={e => handleEnterKey(e, typeRef)}
            value={form.sheetType}
            onChange={v => setForm(f => ({ ...f, sheetType: v }))}
            options={SHEET_TYPES}
          />
        </FormField>

        {/* 상담 구분 */}
        <FormField label="상담 구분" required>
          <Select
            selectRef={typeRef}
            onKeyDown={e => handleEnterKey(e, summaryRef)}
            value={form.type}
            onChange={v => setForm(f => ({ ...f, type: v }))}
            options={COUNSELING_TYPES}
            placeholder="구분 선택..."
          />
        </FormField>

        {/* 상담 제목 */}
        <FormField label="상담 제목" required>
          <input
            ref={summaryRef}
            onKeyDown={e => handleEnterKey(e, detailRef)}
            type="text"
            value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            placeholder="한 줄 요약..."
            className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </FormField>

        {/* 상담 내용 */}
        <FormField label="상담 내용 (상세)" required>
          <textarea
            ref={detailRef}
            value={form.detail}
            onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
            placeholder="상담 내용을 입력하세요..."
            rows={8}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all leading-relaxed"
            style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </FormField>
      </div>

      {/* 하단 버튼 */}
      <div
        className="px-4 py-3 flex gap-2 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setEditorOpen(false)}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
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
          className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'var(--accent)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(75,142,241,0.35)',
          }}
        >
          <Save size={14} />
          저장
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

function Select({ selectRef, onKeyDown, value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        ref={selectRef}
        onKeyDown={onKeyDown}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none appearance-none transition-all pr-8"
        style={{
          background: 'var(--bg-primary)',
          border: '1.5px solid var(--border)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      >
        {placeholder && <option value="" style={{ color: 'var(--text-muted)' }}>{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }} />
    </div>
  )
}
