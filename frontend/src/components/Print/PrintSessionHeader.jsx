import { formatDate } from '@/components/ui/shared'

export default function PrintSessionHeader({ session }) {
  // 학년/반 포맷팅
  const formatGradeClass = () => {
    const gradeText = session.grade ? `${session.grade}학년` : ''
    let classText = ''
    if (session.ban) {
      classText = ` ${session.ban}반`
    } else if (session.studentId) {
      // fallback: studentId에서 추출 (1203 -> 2반, 10203 -> 2반, 11203 -> 12반)
      const sid = String(session.studentId).trim()
      if (sid && /^\d+$/.test(sid)) {
        if (sid.length === 4) {
          classText = ` ${parseInt(sid.substring(1, 2), 10)}반`
        } else if (sid.length === 5) {
          classText = ` ${parseInt(sid.substring(1, 3), 10)}반`
        }
      }
    }
    return `${gradeText}${classText}` || '-'
  }

  // 회기 표시 가공
  const formatSessionNumber = () => {
    const sess = session.session ? String(session.session).trim() : ''
    if (!sess) return '1회기'
    if (sess === '단회') return '단회'
    return sess.endsWith('회기') ? sess : `${sess}회기`
  }

  return (
    <table className="w-full border-collapse border border-black text-center text-[11pt] text-black" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '12%' }} />
        <col style={{ width: '21%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '21%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '22%' }} />
      </colgroup>
      <tbody>
        <tr className="h-10">
          <td className="border border-black bg-gray-50 font-bold">이름</td>
          <td className="border border-black font-semibold truncate" style={{ wordBreak: 'keep-all' }}>
            {session.name || '집단상담'}
          </td>
          <td className="border border-black bg-gray-50 font-bold">성별</td>
          <td className="border border-black font-medium">
            {session.gender || '-'}
          </td>
          <td className="border border-black bg-gray-50 font-bold">학년/반</td>
          <td className="border border-black font-medium">
            {formatGradeClass()}
          </td>
        </tr>
        <tr className="h-10">
          <td className="border border-black bg-gray-50 font-bold">상담회기</td>
          <td className="border border-black font-semibold">
            {formatSessionNumber()}
          </td>
          <td className="border border-black bg-gray-50 font-bold">상담일자</td>
          <td className="border border-black font-medium">
            {formatDate(session.date)}
          </td>
          <td className="border border-black bg-gray-50 font-bold">상담시간</td>
          <td className="border border-black font-medium truncate" style={{ wordBreak: 'keep-all' }} title={session.counselingTime || '미기록'}>
            {session.counselingTime || '미기록'}
          </td>
        </tr>
        <tr className="h-10">
          <td className="border border-black bg-gray-50 font-bold">상담유형</td>
          <td className="border border-black font-semibold">
            {session.sheetType || '-'}
          </td>
          <td className="border border-black bg-gray-50 font-bold">상담구분</td>
          <td colSpan={3} className="border border-black font-semibold text-left px-3 truncate" style={{ wordBreak: 'keep-all' }} title={session.type || '-'}>
            {session.type || '-'}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
