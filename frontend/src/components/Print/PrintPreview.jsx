import { useState, useEffect, useRef } from 'react'
import { X, Printer, Loader2, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { filterSessionsByDateRange } from '@/utils/dateHelper'
import { sortPrintSessions } from '@/utils/printSort'
import PrintReportCard from './PrintReportCard'
import PrintRegisterTable from './PrintRegisterTable'
import { getSortText, getPeriodText } from './printFormatters'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8765'

export default function PrintPreview({ setupData, onBack }) {
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
          // 2. 상담 유형별 또는 전체 데이터 처리 (백엔드 API 호출)
          let url = `${API_BASE}/sessions`
          if (printTarget === 'type' && sheetType) {
            const backendSheetType = sheetType === '또래상담' ? '집단상담' : sheetType
            url += `?sheet_type=${encodeURIComponent(backendSheetType)}`
          }

          const res = await fetch(url)
          if (!res.ok) throw new Error('인쇄용 데이터를 불러오지 못했습니다.')
          rawData = await res.json()
        }

        // 집단상담일 경우 또래상담 제외, 또래상담일 경우 또래상담만 포함
        let baseData = rawData
        if (sheetType === '집단상담') {
          baseData = rawData.filter(s => !s.programName?.includes('또래상담') && !s.summary?.includes('또래상담'))
        } else if (sheetType === '또래상담') {
          baseData = rawData.filter(s => s.programName?.includes('또래상담') || s.summary?.includes('또래상담'))
        }

        // 기간 필터링 적용 (데이터 불변성 유지)
        const filteredData = filterSessionsByDateRange(baseData, startDate, endDate)

        // 정렬 유틸 적용
        const sorted = sortPrintSessions(filteredData, sortBy)
        setPrintData(sorted)
        setLoading(false)
      } catch (e) {
        useAppStore.getState().addToast(e.message, 'error')
        onBack()
      }
    }

    loadPrintData()
  }, [setupData, storeSessions, onBack])

  const handlePrintTrigger = () => {
    window.print()
  }

  // ESC 키 클릭 시 미리보기 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-accent mb-2" style={{ color: 'var(--accent)' }} />
        <p className="text-sm font-semibold text-gray-500">인쇄용 데이터를 불러오는 중...</p>
      </div>
    )
  }

  const { printFormat, printTarget, sheetType, sortBy, startDate, endDate } = setupData

  const getSchoolYear = () => {
    if (startDate && startDate.length >= 4) {
      return startDate.substring(0, 4)
    }
    if (printData && printData.length > 0) {
      const dates = printData.map(s => s.date).filter(Boolean).sort()
      if (dates.length > 0) {
        return dates[0].substring(0, 4)
      }
    }
    return new Date().getFullYear().toString()
  }

  const getTypeText = () => {
    if (printTarget === 'type') return sheetType
    if (printTarget === 'student') return `${setupData.studentName} 학생`
    return '전체상담'
  }

  // 데이터 그룹화 및 A4 용지 규격 기준 동적 페이지 분할
  const getGroupedAndPaginatedPages = (data) => {
    if (sheetType === '집단상담' || sheetType === '또래상담') {
      const pages = []
      let currentPage = []
      let maxLines = 18 // 첫 페이지 최대 라인 수 (헤더 고려)
      
      data.forEach((session) => {
        if (currentPage.length >= maxLines) {
          pages.push(currentPage)
          currentPage = [session]
          maxLines = 22 // 이후 페이지 최대 라인 수
        } else {
          currentPage.push(session)
        }
      })
      
      if (currentPage.length > 0) {
        pages.push(currentPage)
      }
      return pages
    }

    // 1. 학생별 그룹화 처리
    const groupedData = []
    const seenKeys = new Map()

    data.forEach((session) => {
      const name = session.name || '집단상담'
      const studentId = session.studentId || ''
      const grade = session.grade || ''
      const ban = session.ban || ''
      
      const key = `${name}_${studentId}`
      if (!seenKeys.has(key)) {
        const newEntry = {
          name,
          studentId,
          grade,
          ban,
          session,
          types: [] // array of { typeName, count }
        }
        seenKeys.set(key, groupedData.length)
        groupedData.push(newEntry)
      }

      const entry = groupedData[seenKeys.get(key)]
      const typeName = session.type || '-'
      
      let typeObj = entry.types.find(t => t.typeName === typeName)
      if (!typeObj) {
        typeObj = { typeName, count: 0 }
        entry.types.push(typeObj)
      }
      typeObj.count += 1
    })

    // 2. 라인 수 기반 용지 규격 페이지 분할
    const pages = []
    let currentPage = []
    let currentLines = 0
    let maxLines = 24 // 첫 페이지 최대 수용 라인 수

    groupedData.forEach((student) => {
      const lines = student.types.length || 1
      if (currentLines + lines > maxLines && currentPage.length > 0) {
        pages.push(currentPage)
        currentPage = [student]
        currentLines = lines
        maxLines = 28 // 이후 페이지 최대 수용 라인 수
      } else {
        currentPage.push(student)
        currentLines += lines
      }
    })

    if (currentPage.length > 0) {
      pages.push(currentPage)
    }

    return pages
  }

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
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-700 hover:bg-neutral-600 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            뒤로 돌아가기 (ESC)
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
          <div className="w-[210mm] mx-auto space-y-8 print:w-full print:space-y-0">
            {getGroupedAndPaginatedPages(printData).map((pageRows, pageIdx, allPages) => {
              let startIndex = 0
              for (let i = 0; i < pageIdx; i++) {
                startIndex += allPages[i].length
              }
              
              return (
                <div 
                  key={pageIdx}
                  className="print-page w-[210mm] min-h-[297mm] mx-auto p-[20mm] bg-white border border-neutral-200 shadow-2xl relative page-break print:w-full print:border-none print:shadow-none print:p-[10mm]"
                >
                  {pageIdx === 0 && (
                    <>
                      {/* 타이틀 */}
                      <h1 className="text-center font-bold text-xl mb-6 text-black">
                        {getSchoolYear()}학년도 학생 상담 현황({getTypeText()})
                      </h1>
                    </>
                  )}
                  {/* 대장 테이블 */}
                  <PrintRegisterTable 
                    groupedData={pageRows} 
                    startIndex={startIndex} 
                    isGroup={sheetType === '집단상담' || sheetType === '또래상담'} 
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
