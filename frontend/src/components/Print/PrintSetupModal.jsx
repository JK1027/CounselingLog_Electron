import { useState, useEffect } from 'react'
import { X, Printer, FileText, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import DateInput from '@/components/ui/DateInput'
import { isValidYYYYMMDD, getTodayDateString, getThisWeekRange, getThisMonthRange, getThisSemesterRange } from '@/utils/dateHelper'

export default function PrintSetupModal({ isOpen, onClose, onPreview, initialConfig }) {
  const { selectedStudent, sessions } = useAppStore()
  
  const [printTarget, setPrintTarget] = useState('student') // 'student' | 'type' | 'all'
  const [sheetType, setSheetType] = useState('개인상담')
  const [sessionFilter, setSessionFilter] = useState('all') // 'all' | sessionId
  const [printFormat, setPrintFormat] = useState('report') // 'report' | 'table'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date_asc') // 'date_asc' | 'date_desc' | 'name_asc' | 'sheet_asc'

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 기본값 리셋 또는 이전 설정 복원
      const target = initialConfig?.printTarget || initialConfig?.initialTarget || (selectedStudent && !selectedStudent.isGroupTab ? 'student' : 'all')
      const defaultSheet = initialConfig?.sheetType || initialConfig?.defaultSheetType || '개인상담'
      const sessionFilt = initialConfig?.sessionFilter || 'all'
      const prtFormat = initialConfig?.printFormat || 'report'
      const stDate = initialConfig?.startDate || ''
      const enDate = initialConfig?.endDate || ''
      const sort = initialConfig?.sortBy || 'date_asc'

      setPrintTarget(target)
      setSheetType(defaultSheet)
      setSessionFilter(sessionFilt)
      setPrintFormat(prtFormat)
      setStartDate(stDate)
      setEndDate(enDate)
      setSortBy(sort)
    }
  }, [isOpen, selectedStudent, initialConfig])

  if (!isOpen) return null

  const handlePresetClick = (presetType) => {
    const today = getTodayDateString()
    switch (presetType) {
      case 'today':
        setStartDate(today)
        setEndDate(today)
        break
      case 'week': {
        const { start, end } = getThisWeekRange()
        setStartDate(start)
        setEndDate(end)
        break
      }
      case 'month': {
        const { start, end } = getThisMonthRange()
        setStartDate(start)
        setEndDate(end)
        break
      }
      case 'semester': {
        const { start, end } = getThisSemesterRange()
        setStartDate(start)
        setEndDate(end)
        break
      }
      case 'clear':
        setStartDate('')
        setEndDate('')
        break
      default:
        break
    }
  }

  const handlePreviewClick = () => {
    // 날짜 유효성 검사 (입력된 경우에만 검증)
    if (startDate && !isValidYYYYMMDD(startDate)) {
      useAppStore.getState().addToast('시작일은 YYYYMMDD 8자리 올바른 날짜여야 합니다.', 'error')
      return
    }
    if (endDate && !isValidYYYYMMDD(endDate)) {
      useAppStore.getState().addToast('종료일은 YYYYMMDD 8자리 올바른 날짜여야 합니다.', 'error')
      return
    }
    if (startDate && endDate && startDate > endDate) {
      useAppStore.getState().addToast('시작일은 종료일보다 이전 날짜여야 합니다.', 'error')
      return
    }

    onPreview({
      printTarget,
      sheetType,
      sessionFilter,
      printFormat,
      startDate,
      endDate,
      sortBy,
      studentName: selectedStudent?.name,
      studentId: selectedStudent?.studentId
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center print-exclude"
      style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <Printer size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>상담일지 출력 설정</h3>
          </div>
          <button onClick={onClose} className="hover:opacity-75 transition-opacity cursor-pointer">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 space-y-5 text-sm">
          {/* 1. 출력 대상 범위 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              1. 출력 대상 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={!selectedStudent || selectedStudent.isGroupTab || initialConfig?.disableStudentOption}
                onClick={() => setPrintTarget('student')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-semibold ${
                  (!selectedStudent || selectedStudent.isGroupTab || initialConfig?.disableStudentOption) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
                style={{
                  background: printTarget === 'student' ? 'var(--accent-soft)' : 'var(--bg-primary)',
                  borderColor: printTarget === 'student' ? 'var(--accent)' : 'var(--border)',
                  color: printTarget === 'student' ? 'var(--accent-dark)' : 'var(--text-primary)'
                }}
              >
                <span className="text-xs font-bold">선택된 학생</span>
                <span className="text-[10px] truncate max-w-full opacity-80">
                  {selectedStudent && !selectedStudent.isGroupTab && !initialConfig?.disableStudentOption
                    ? `${selectedStudent.name} (${selectedStudent.studentId || ''})`
                    : '선택 없음'}
                </span>
              </button>

              <button
                onClick={() => setPrintTarget('type')}
                className="py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-semibold cursor-pointer"
                style={{
                  background: printTarget === 'type' ? 'var(--accent-soft)' : 'var(--bg-primary)',
                  borderColor: printTarget === 'type' ? 'var(--accent)' : 'var(--border)',
                  color: printTarget === 'type' ? 'var(--accent-dark)' : 'var(--text-primary)'
                }}
              >
                <span className="text-xs font-bold">상담 유형별</span>
                <span className="text-[10px] opacity-80">개인/집단/보호자 등</span>
              </button>

              <button
                onClick={() => setPrintTarget('all')}
                className="py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-semibold cursor-pointer"
                style={{
                  background: printTarget === 'all' ? 'var(--accent-soft)' : 'var(--bg-primary)',
                  borderColor: printTarget === 'all' ? 'var(--accent)' : 'var(--border)',
                  color: printTarget === 'all' ? 'var(--accent-dark)' : 'var(--text-primary)'
                }}
              >
                <span className="text-xs font-bold">전체 출력</span>
                <span className="text-[10px] opacity-80">모든 시트 데이터</span>
              </button>
            </div>
          </div>

          {/* 2. 세부 필터 (동적 노출) */}
          {printTarget === 'student' && selectedStudent && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                2. 상세 범위 지정
              </label>
              <select
                value={sessionFilter}
                onChange={e => setSessionFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl outline-none transition-all cursor-pointer text-sm"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="all">전체 상담 회기 ({sessions.length}건)</option>
                {sessions.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {s.session 
                      ? (String(s.session).trim() === '단회' 
                          ? '단회' 
                          : (String(s.session).trim().endsWith('회기') ? String(s.session).trim() : `${String(s.session).trim()}회기`)) 
                      : `${sessions.length - idx}번째`} · {s.date} · {s.type} · {s.summary}
                  </option>
                ))}
              </select>
            </div>
          )}

          {printTarget === 'type' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                2. 상담 유형(시트) 선택
              </label>
              <select
                value={sheetType}
                onChange={e => setSheetType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl outline-none transition-all cursor-pointer text-sm"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="개인상담">개인상담</option>
                <option value="집단상담">집단상담</option>
                <option value="보호자상담">보호자상담</option>
                <option value="교원자문">교원자문</option>
                <option value="의뢰">의뢰</option>
              </select>
            </div>
          )}

          {/* 3. 조회 기간 설정 (선택) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              3. 조회 기간 설정 (선택)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DateInput
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="시작일 (YYYYMMDD)"
                />
              </div>
              <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>~</span>
              <div className="flex-1">
                <DateInput
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="종료일 (YYYYMMDD)"
                />
              </div>
            </div>
            
            {/* 프리셋 버튼 */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handlePresetClick('today')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-hover cursor-pointer border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('week')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-hover cursor-pointer border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                이번 주
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('month')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-hover cursor-pointer border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                이번 달
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('semester')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-hover cursor-pointer border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                이번 학기
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('clear')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-hover cursor-pointer border hover:text-red-500"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                전체 기간(초기화)
              </button>
            </div>
          </div>

          {/* 4. 정렬 기준 선택 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              4. 정렬 기준 선택
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl outline-none transition-all cursor-pointer text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="date_asc">날짜 오래된 순</option>
              <option value="date_desc">날짜 최신 순</option>
              <option value="name_asc">이름 가나다 순</option>
              <option value="sheet_asc">상담 유형 우선순위 순</option>
            </select>
          </div>

          {/* 5. 출력 양식 선택 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              5. 출력 양식 선택
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-hover"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: printFormat === 'report' ? 'var(--accent)' : 'var(--border)',
                }}
              >
                <input
                  type="radio"
                  name="printFormat"
                  value="report"
                  checked={printFormat === 'report'}
                  onChange={() => setPrintFormat('report')}
                  className="mt-0.5 accent-accent"
                />
                <div>
                  <span className="block font-bold text-xs" style={{ color: 'var(--text-primary)' }}>상세 보고서 양식</span>
                  <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    개별 상담 내역을 A4 한 장 형태의 공문서 일지로 인쇄합니다.
                  </span>
                </div>
              </label>

              <label
                className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-hover"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: printFormat === 'table' ? 'var(--accent)' : 'var(--border)',
                }}
              >
                <input
                  type="radio"
                  name="printFormat"
                  value="table"
                  checked={printFormat === 'table'}
                  onChange={() => setPrintFormat('table')}
                  className="mt-0.5 accent-accent"
                />
                <div>
                  <span className="block font-bold text-xs" style={{ color: 'var(--text-primary)' }}>대장(목록) 양식</span>
                  <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    여러 건의 요약 정보를 하나의 큰 표(스프레드시트) 형태로 출력합니다.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div
          className="px-5 py-4 flex gap-2 justify-end"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-hover cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            취소
          </button>
          <button
            onClick={handlePreviewClick}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            <FileText size={13} />
            인쇄 미리보기
          </button>
        </div>
      </div>
    </div>
  )
}
