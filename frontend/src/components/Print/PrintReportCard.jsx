import PrintSessionHeader from './PrintSessionHeader'

export default function PrintReportCard({ session }) {
  const isGroup = session.sheetType === '집단상담'
  const todayStr = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })

  return (
    <div 
      className="print-page w-[210mm] min-h-[297mm] p-[20mm] bg-white border border-neutral-200 shadow-2xl relative mx-auto page-break print:border-none print:shadow-none print:p-[10mm] print:min-h-0"
      style={{ contentVisibility: 'auto' }}
    >
      {/* 상단 서식명 */}
      <h1 className="text-center font-bold text-2xl tracking-[0.15em] pl-[0.15em] mb-4 mt-4 text-black border-b-2 border-double border-black pb-3">
        {isGroup ? 'Wee 집단상담 기록지' : 'Wee 개인상담 기록지'}
      </h1>

      {/* 출력일시 메타정보 */}
      <div className="flex justify-end text-[9pt] text-gray-500 mb-2 font-medium">
        출력일시: {todayStr}
      </div>

      {/* 격자 테이블 헤더 */}
      <PrintSessionHeader session={session} />
      
      {/* 상담제목 및 상세 내용 표 */}
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
  )
}
