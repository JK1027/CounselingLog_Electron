import { formatDate } from '@/components/ui/shared'

export default function PrintRegisterTable({ printData }) {
  return (
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
  )
}
