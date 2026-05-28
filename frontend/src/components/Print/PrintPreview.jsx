import { useState, useEffect } from 'react'
import { X, Printer, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatDate } from '@/components/ui/shared'
import { filterSessionsByDateRange } from '@/utils/dateHelper'
import { sortPrintSessions } from '@/utils/printSort'
import PrintSessionHeader from '@/components/Print/PrintSessionHeader'

const API_BASE = 'http://localhost:8765'

export default function PrintPreview({ setupData, onClose }) {
  const { sessions: storeSessions } = useAppStore()
  const [printData, setPrintData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!setupData) return

    const loadPrintData = async () => {
      setLoading(true)
      try {
        const { printTarget, sheetType, sessionFilter, startDate, endDate, sortBy } = setupData

        let rawData = []
        if (printTarget === 'student') {
          // 1. 현재 선택된 학생의 데이터 처리
          if (sessionFilter === 'all') {
            rawData = storeSessions
          } else {
            // 특정 회기
            rawData = storeSessions.filter(s => s.id === sessionFilter)
          }
        } else {
          // 2. 상담 유형별 또는 전체 데이터 처리 (백엔드 API 호출)
          let url = `${API_BASE}/sessions`
          if (printTarget === 'type' && sheetType) {
            url += `?sheet_type=${encodeURIComponent(sheetType)}`
          }

          const res = await fetch(url)
          if (!res.ok) throw new Error('인쇄용 데이터를 불러오지 못했습니다.')
          rawData = await res.json()
        }

        // 기간 필터링 적용 (데이터 불변성 유지)
        const filteredData = filterSessionsByDateRange(rawData, startDate, endDate)

        // 정렬 유틸 적용
        const sorted = sortPrintSessions(filteredData, sortBy)
        setPrintData(sorted)
        setLoading(false)
      } catch (e) {
        useAppStore.getState().addToast(e.message, 'error')
        onClose()
      }
    }

    loadPrintData()
  }, [setupData, storeSessions])

  const handlePrintTrigger = () => {
    window.print()
  }

  // ESC 키 클릭 시 미리보기 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-accent mb-2" style={{ color: 'var(--accent)' }} />
        <p className="text-sm font-semibold text-gray-500">인쇄용 데이터를 불러오는 중...</p>
      </div>
    )
  }

  const getSortText = (sortKey) => {
    switch (sortKey) {
      case 'date_desc':
        return '날짜 최신 순'
      case 'name_asc':
        return '이름 가나다 순'
      case 'sheet_asc':
        return '상담 유형 우선순위 순'
      case 'date_asc':
      default:
        return '날짜 오래된 순'
    }
  }

  const getPeriodText = () => {
    const { startDate, endDate } = setupData || {}
    if (!startDate && !endDate) return '전체 기간'

    const format = (d) => {
      if (!d || d.length !== 8) return ''
      return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`
    }

    const startStr = format(startDate) || '시작일 제한 없음'
    const endStr = format(endDate) || '종료일 제한 없음'
    return `${startStr} ~ ${endStr}`
  }

  const { printFormat, printTarget, sheetType, sortBy } = setupData

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-900 overflow-y-auto no-scrollbar print-preview-container print:bg-white print:static print:overflow-visible">
      {/* 미리보기 제어 툴바 */}
      <div className="flex items-center justify-between px-6 py-4 bg-neutral-800 border-b border-neutral-700 text-white shrink-0 print-exclude">
        <div className="flex items-center gap-3">
          <Printer size={18} className="text-indigo-400" />
          <h2 className="text-sm font-bold">인쇄 미리보기</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-700 text-neutral-300 font-medium">
            A4 규격 · {printData.length}건의 일지 발견
          </span>
          <span className="text-xs text-neutral-400 font-semibold hidden md:inline ml-2 border-l border-neutral-600 pl-3">
            기간: {getPeriodText()}
          </span>
          <span className="text-xs text-neutral-400 font-semibold hidden md:inline ml-2 border-l border-neutral-600 pl-3">
            정렬: {getSortText(sortBy)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-700 hover:bg-neutral-600 active:scale-95 transition-all cursor-pointer"
          >
            닫기 (ESC)
          </button>
          <button
            onClick={handlePrintTrigger}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Printer size={14} />
            인쇄 및 PDF 저장
          </button>
        </div>
      </div>

      {/* 종이 출력 본문 */}
      <div className="flex-1 flex justify-center p-8 bg-neutral-900/40 print:p-0 print:bg-white print:block" id="print-preview-root">
        {printFormat === 'report' ? (
          /* 상세 보고서 양식 */
          <div className="w-[210mm] space-y-8 print:w-full print:space-y-0">
            {printData.map((session, idx) => (
              <div 
                key={session.id} 
                className="print-page w-[210mm] min-h-[297mm] p-[20mm] bg-white border border-neutral-200 shadow-2xl relative mx-auto page-break print:border-none print:shadow-none print:p-[10mm] print:min-h-0"
                style={{ contentVisibility: 'auto' }}
              >
                {/* 상단 서식명 */}
                <h1 className="text-center font-bold text-2xl tracking-[0.15em] pl-[0.15em] mb-4 mt-4 text-black border-b-2 border-double border-black pb-3">
                  {session.sheetType === '집단상담' ? 'Wee 집단상담 기록지' : 'Wee 개인상담 기록지'}
                </h1>

                {/* 출력일시 메타정보 */}
                <div className="flex justify-end text-[9pt] text-gray-500 mb-2 font-medium">
                  출력일시: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </div>

                {/* 격자 테이블 */}
                <PrintSessionHeader session={session} />
                
                <table className="w-full border-collapse border border-black text-center text-[11pt] text-black -mt-[1px]" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '88%' }} />
                  </colgroup>
                  <tbody>
                    <tr className="h-11">
                      <td className="border border-black bg-gray-50 font-bold">상담제목</td>
                      <td className="border border-black text-left px-3 font-bold bg-neutral-50/50 truncate" style={{ wordBreak: 'keep-all' }} title={session.summary}>
                        {session.summary}
                      </td>
                    </tr>
                    <tr>
                      <td 
                        colSpan={2} 
                        className="border border-black text-left align-top p-4 h-[190mm] whitespace-pre-wrap leading-[1.8] text-[10.5pt] font-normal"
                        style={{ wordBreak: 'break-all' }}
                      >
                        {session.detail}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          /* 대장(목록) 양식 */
          <div 
            className="print-page w-[210mm] min-h-[297mm] p-[20mm] bg-white border border-neutral-200 shadow-2xl relative page-break print:w-full print:border-none print:shadow-none print:p-[10mm]"
          >
            {/* 타이틀 */}
            <h1 className="text-center font-bold text-xl mb-1 text-black">
              상담일지 작성 대장 ({printTarget === 'type' ? sheetType : printTarget === 'student' ? `${setupData.studentName} 학생` : '전체 내역'})
            </h1>
            <p className="text-center text-[10px] text-gray-500 mb-6 font-semibold">
              조회 기간: {getPeriodText()} &nbsp;|&nbsp; 정렬 기준: {getSortText(sortBy)}
            </p>

            {/* 대장 테이블 */}
            <table className="w-full border-collapse border border-neutral-300 text-left text-xs text-black">
              <thead>
                <tr className="bg-neutral-100/80 font-bold border-b border-neutral-300 text-center h-10">
                  <th className="border border-neutral-300 w-[7%]">순번</th>
                  <th className="border border-neutral-300 w-[12%]">상담일자</th>
                  <th className="border border-neutral-300 w-[15%]">학생명</th>
                  <th className="border border-neutral-300 w-[18%]">학년/학번</th>
                  <th className="border border-neutral-300 w-[13%]">상담유형</th>
                  <th className="border border-neutral-300 w-[13%]">상담구분</th>
                  <th className="border border-neutral-300 px-3 w-[22%]">상담제목</th>
                </tr>
              </thead>
              <tbody>
                {printData.map((session, idx) => (
                  <tr key={session.id} className="h-9 hover:bg-neutral-50/50 print:hover:bg-transparent">
                    <td className="border border-neutral-300 text-center font-medium">{idx + 1}</td>
                    <td className="border border-neutral-300 text-center">{formatDate(session.date)}</td>
                    <td className="border border-neutral-300 text-center font-semibold">{session.name || '집단상담'}</td>
                    <td className="border border-neutral-300 text-center">
                      {session.grade ? `${session.grade}학년` : ''} {session.studentId ? `(${session.studentId})` : ''}
                    </td>
                    <td className="border border-neutral-300 text-center">{session.sheetType}</td>
                    <td className="border border-neutral-300 text-center font-medium">{session.type}</td>
                    <td className="border border-neutral-300 px-3 truncate max-w-[200px]" title={session.summary}>
                      {session.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
