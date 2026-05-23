import { useState, useEffect } from 'react'
import { X, Printer, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatDate } from '@/components/ui/shared'

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
        const { printTarget, sheetType, sessionFilter } = setupData

        if (printTarget === 'student') {
          // 1. 현재 선택된 학생의 데이터 처리
          if (sessionFilter === 'all') {
            // 전체 회기 (날짜 순서대로 보여주기 위해 오름차순 정렬)
            const sorted = [...storeSessions].sort((a, b) => a.date.localeCompare(b.date))
            setPrintData(sorted)
          } else {
            // 특정 회기
            const single = storeSessions.filter(s => s.id === sessionFilter)
            setPrintData(single)
          }
          setLoading(false)
        } else {
          // 2. 상담 유형별 또는 전체 데이터 처리 (백엔드 API 호출)
          let url = `${API_BASE}/sessions`
          if (printTarget === 'type' && sheetType) {
            url += `?sheet_type=${encodeURIComponent(sheetType)}`
          }

          const res = await fetch(url)
          if (!res.ok) throw new Error('인쇄용 데이터를 불러오지 못했습니다.')
          const data = await res.json()
          
          // 인쇄용은 날짜 오름차순(오래된 순) 정렬하여 대장이나 보고서에 순차 기입
          const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
          setPrintData(sorted)
          setLoading(false)
        }
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

  const { printFormat, printTarget, sheetType } = setupData

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
                <h1 className="text-center font-bold text-2xl tracking-[1em] pl-[1em] mb-8 mt-4 text-black border-b-2 border-double border-black pb-3">
                  상담일지
                </h1>

                {/* 격자 테이블 */}
                <table className="w-full border-collapse border border-black text-center text-[11pt] text-black">
                  <tbody>
                    <tr className="h-10">
                      <td className="w-[15%] border border-black bg-gray-50 font-bold">피상담자</td>
                      <td className="w-[35%] border border-black font-semibold">
                        {session.name || '집단상담'}
                      </td>
                      <td className="w-[15%] border border-black bg-gray-50 font-bold">학년/학번</td>
                      <td className="w-[35%] border border-black">
                        {session.grade ? `${session.grade}학년` : ''} {session.studentId ? `/ ${session.studentId}` : ''}
                      </td>
                    </tr>
                    <tr className="h-10">
                      <td className="border border-black bg-gray-50 font-bold">상담일자</td>
                      <td className="border border-black font-medium">{formatDate(session.date)}</td>
                      <td className="border border-black bg-gray-50 font-bold">상담구분</td>
                      <td className="border border-black font-semibold">{session.type}</td>
                    </tr>
                    <tr className="h-10">
                      <td className="border border-black bg-gray-50 font-bold">상담회기</td>
                      <td className="border border-black font-semibold">
                        {session.session 
                          ? (String(session.session).trim().endsWith('회기') 
                              ? String(session.session).trim() 
                              : `${String(session.session).trim()}회기`) 
                          : '1회기'}
                      </td>
                      <td className="border border-black bg-gray-50 font-bold">상담유형</td>
                      <td className="border border-black font-semibold">{session.sheetType}</td>
                    </tr>
                    <tr className="h-11">
                      <td colSpan={4} className="border border-black text-left px-3 font-bold bg-neutral-50/50">
                        * 상담제목: {session.summary}
                      </td>
                    </tr>
                    <tr>
                      <td 
                        colSpan={4} 
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
            <h1 className="text-center font-bold text-xl mb-6 text-black">
              상담일지 작성 대장 ({printTarget === 'type' ? sheetType : printTarget === 'student' ? `${setupData.studentName} 학생` : '전체 내역'})
            </h1>

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
