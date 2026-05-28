import { useState, useEffect, useRef } from 'react'
import { X, Printer, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { filterSessionsByDateRange } from '@/utils/dateHelper'
import { sortPrintSessions } from '@/utils/printSort'
import PrintReportCard from './PrintReportCard'
import PrintRegisterTable from './PrintRegisterTable'
import { getSortText, getPeriodText } from './printFormatters'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8765'

export default function PrintPreview({ setupData, onClose }) {
  const { sessions: storeSessions } = useAppStore()
  const [printData, setPrintData] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ 
        top: containerRef.current.scrollHeight, 
        behavior: 'smooth' 
      })
    }
  }

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
  }, [setupData, storeSessions, onClose])

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

  const { printFormat, printTarget, sheetType, sortBy, startDate, endDate } = setupData

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-neutral-900 overflow-hidden print-preview-container print:bg-white print:static print:overflow-visible"
    >
      {/* 플로팅 스크롤 버튼 (인쇄 제외) */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[110] flex flex-col gap-3 print-exclude">
        <button
          onClick={scrollToTop}
          title="가장 상단으로"
          className="p-3.5 rounded-full bg-neutral-800/80 hover:bg-indigo-500 active:scale-95 text-white border border-neutral-700 hover:border-indigo-400 shadow-xl transition-all cursor-pointer group hover:shadow-indigo-500/20"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <ArrowUp size={18} className="group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <button
          onClick={scrollToBottom}
          title="가장 하단으로"
          className="p-3.5 rounded-full bg-neutral-800/80 hover:bg-indigo-500 active:scale-95 text-white border border-neutral-700 hover:border-indigo-400 shadow-xl transition-all cursor-pointer group hover:shadow-indigo-500/20"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <ArrowDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* 미리보기 제어 툴바 */}
      <div className="flex items-center justify-between px-6 py-4 bg-neutral-800 border-b border-neutral-700 text-white shrink-0 print-exclude">
        <div className="flex items-center gap-3">
          <Printer size={18} className="text-indigo-400" />
          <h2 className="text-sm font-bold">인쇄 미리보기</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-700 text-neutral-300 font-medium">
            A4 규격 · {printData.length}건의 일지 발견
          </span>
          <span className="text-xs text-neutral-400 font-semibold hidden md:inline ml-2 border-l border-neutral-600 pl-3">
            기간: {getPeriodText(startDate, endDate)}
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

      {/* 종이 출력 본문 (스크롤 영역) */}
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar p-8 bg-neutral-900/40 print:p-0 print:bg-white print:block scroll-smooth" 
        id="print-preview-root"
      >
        {printFormat === 'report' ? (
          /* 상세 보고서 양식 */
          <div className="w-[210mm] mx-auto space-y-8 print:w-full print:space-y-0">
            {printData.map((session) => (
              <PrintReportCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          /* 대장(목록) 양식 */
          <div 
            className="print-page w-[210mm] min-h-[297mm] mx-auto p-[20mm] bg-white border border-neutral-200 shadow-2xl relative page-break print:w-full print:border-none print:shadow-none print:p-[10mm]"
          >
            {/* 타이틀 */}
            <h1 className="text-center font-bold text-xl mb-1 text-black">
              상담일지 작성 대장 ({printTarget === 'type' ? sheetType : printTarget === 'student' ? `${setupData.studentName} 학생` : '전체 내역'})
            </h1>
            <p className="text-center text-[10px] text-gray-500 mb-6 font-semibold">
              조회 기간: {getPeriodText(startDate, endDate)} &nbsp;|&nbsp; 정렬 기준: {getSortText(sortBy)}
            </p>

            {/* 대장 테이블 */}
            <PrintRegisterTable printData={printData} />
          </div>
        )}
      </div>
    </div>
  )
}
