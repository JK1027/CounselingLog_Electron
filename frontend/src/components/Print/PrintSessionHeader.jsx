import { formatDate } from '@/components/ui/shared'
import { useAppStore } from '@/store/useAppStore'

export default function PrintSessionHeader({ session }) {
  // 학년/반/번호 포맷팅
  const formatGradeClassNumber = () => {
    const gradeText = session.grade ? `${session.grade}학년` : ''
    let classText = ''
    let numberText = ''
    
    const sid = session.studentId ? String(session.studentId).trim() : ''
    if (sid && /^\d+$/.test(sid)) {
      if (sid.length === 4) {
        classText = ` ${parseInt(sid.substring(1, 2), 10)}반`
        numberText = ` ${parseInt(sid.substring(2, 4), 10)}번`
      } else if (sid.length === 5) {
        classText = ` ${parseInt(sid.substring(1, 3), 10)}반`
        numberText = ` ${parseInt(sid.substring(3, 5), 10)}번`
      }
    } else {
      if (session.ban) {
        classText = ` ${session.ban}반`
      }
    }
    return `${gradeText}${classText}${numberText}`.trim() || '-'
  }

  // 회기 표시 가공
  const formatSessionNumber = () => {
    const sess = session.session ? String(session.session).trim() : ''
    if (!sess) return '1회기'
    if (sess === '단회') return '단회'
    return sess.endsWith('회기') ? sess : `${sess}회기`
  }

  // 집단상담 참여학생 이름(학번) 변환 매핑
  const getGroupParticipants = () => {
    const { students } = useAppStore.getState()
    if (!session.studentId) return '-'
    
    const rawIds = String(session.studentId).split(',')
    const formatted = rawIds.map(id => {
      const trimmedId = id.trim()
      if (!trimmedId) return ''
      
      // 학번으로 학생 찾기
      const match = students.find(s => String(s.studentId).trim() === trimmedId)
      if (match) {
        return `${match.name}(${trimmedId})`
      }
      return trimmedId // 매칭 학생이 없으면 원래 입력값 유지
    }).filter(Boolean)

    if (formatted.length === 0) {
      return session.studentId
    }
    return formatted.join(', ')
  }

  const isGroup = session.sheetType === '집단상담'

  return (
    <table className="w-full border-collapse border border-black text-center text-[11pt] text-black" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '12%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '17%' }} />
        <col style={{ width: '23%' }} />
      </colgroup>
      <tbody>
        {!isGroup && (
          /* 개인상담 양식 헤더 */
          <tr className="h-10">
            <td className="border border-black bg-gray-50 font-bold">이름</td>
            <td className="border border-black font-semibold truncate" style={{ wordBreak: 'keep-all' }}>
              {session.name || '집단상담'}
            </td>
            <td className="border border-black bg-gray-50 font-bold">성별</td>
            <td className="border border-black font-medium">
              {session.gender || '-'}
            </td>
            <td className="border border-black bg-gray-50 font-bold whitespace-nowrap">학년/반/번호</td>
            <td className="border border-black font-medium">
              {formatGradeClassNumber()}
            </td>
          </tr>
        )}
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
