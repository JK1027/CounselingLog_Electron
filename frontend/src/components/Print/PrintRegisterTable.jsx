export default function PrintRegisterTable({ groupedData, startIndex = 0, isGroup = false, isPeer = false, peerStudentRows = [], totalPeerCount = 0, peerTypes = '', peerSubDetails = '' }) {
  // 학년/반 포맷터
  const formatGradeClass = (student) => {
    const gradeText = student.grade ? (String(student.grade).endsWith('학년') ? student.grade : `${student.grade}학년`) : ''
    let classText = ''
    
    const sid = student.studentId ? String(student.studentId).trim() : ''
    if (sid && /^\d+$/.test(sid)) {
      if (sid.length === 4) {
        classText = ` ${parseInt(sid.substring(1, 2), 10)}반`
      } else if (sid.length === 5) {
        classText = ` ${parseInt(sid.substring(1, 3), 10)}반`
      }
    } else {
      if (student.ban) {
        classText = ` ${student.ban}반`
      }
    }
    return `${gradeText}${classText}`.trim() || '-'
  }
  // ───── 또래상담 전용 인쇄 테이블 ─────
  if (isPeer) {
    const rowCount = peerStudentRows.length
    return (
      <table className="w-full border-collapse border border-neutral-300 text-left text-xs text-black" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '40%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr className="bg-neutral-100/80 font-bold border-b border-neutral-300 text-center h-10">
            <th className="border border-neutral-300 text-center">순번</th>
            <th className="border border-neutral-300 text-center">학생이름</th>
            <th className="border border-neutral-300 text-center">학년/반</th>
            <th className="border border-neutral-300 text-center">상담구분</th>
            <th className="border border-neutral-300 text-center">세부내용</th>
            <th className="border border-neutral-300 text-center">총 횟수</th>
          </tr>
        </thead>
        <tbody>
          {peerStudentRows.map((student, idx) => (
            <tr key={idx} className="hover:bg-neutral-50/50 print:hover:bg-transparent h-10">
              <td className="border border-neutral-300 text-center font-medium py-2">{startIndex + idx + 1}</td>
              <td className="border border-neutral-300 text-center font-semibold py-2">{student.name}</td>
              <td className="border border-neutral-300 text-center py-2">{student.gradeClass}</td>
              {/* 첫 행에만 상담구분 rowspan */}
              {idx === 0 && (
                <td
                  className="border border-neutral-300 text-center py-2 whitespace-pre-line"
                  rowSpan={rowCount}
                  style={{ verticalAlign: 'middle' }}
                >
                  {peerTypes || '또래상담'}
                </td>
              )}
              {/* 첫 행에만 세부내용 rowspan */}
              {idx === 0 && (
                <td
                  className="border border-neutral-300 px-2 py-2 whitespace-pre-line text-left"
                  rowSpan={rowCount}
                  style={{ verticalAlign: 'top', lineHeight: '1.6' }}
                >
                  {peerSubDetails || '-'}
                </td>
              )}
              {/* 첫 행에만 총 횟수 rowspan */}
              {idx === 0 && (
                <td
                  className="border border-neutral-300 text-center py-2 font-bold text-base"
                  rowSpan={rowCount}
                  style={{ verticalAlign: 'middle' }}
                >
                  {totalPeerCount > 0 ? `${totalPeerCount}회` : '-'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }


  if (isGroup) {
    return (
      <table className="w-full border-collapse border border-neutral-300 text-left text-xs text-black" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <thead>
          <tr className="bg-neutral-100/80 font-bold border-b border-neutral-300 text-center h-10">
            <th className="border border-neutral-300 text-center">순번</th>
            <th className="border border-neutral-300 text-center">학년/반</th>
            <th className="border border-neutral-300 text-center">상담인원</th>
            <th className="border border-neutral-300 text-center">상담제목</th>
            <th className="border border-neutral-300 text-center">상담내용</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.map((session, idx) => (
            <tr key={idx} className="hover:bg-neutral-50/50 print:hover:bg-transparent h-10">
              <td className="border border-neutral-300 text-center font-medium py-2">{startIndex + idx + 1}</td>
              <td className="border border-neutral-300 text-center font-semibold py-2">
                {session.studentId || '-'}
              </td>
              <td className="border border-neutral-300 text-center py-2 font-medium">
                {session.counselingCount ? `${session.counselingCount}명` : (
                  session.studentId ? `${session.studentId.split(',').filter(Boolean).length}명` : '-'
                )}
              </td>
              <td className="border border-neutral-300 px-3 py-2 font-bold text-left whitespace-normal break-all" title={session.summary}>
                {session.summary}
              </td>
              <td className="border border-neutral-300 px-3 py-2 font-normal text-left whitespace-normal break-all" title={session.content || session.detail}>
                {session.content || session.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <table className="w-full border-collapse border border-neutral-300 text-left text-xs text-black">
      <thead>
        <tr className="bg-neutral-100/80 font-bold border-b border-neutral-300 text-center h-10">
          <th className="border border-neutral-300 w-[8%]">순번</th>
          <th className="border border-neutral-300 w-[15%]">이름</th>
          <th className="border border-neutral-300 w-[15%]">학년/반</th>
          <th className="border border-neutral-300 w-[32%]">상담구분</th>
          <th className="border border-neutral-300 w-[12%]">횟수</th>
          <th className="border border-neutral-300 w-[18%]">비고</th>
        </tr>
      </thead>
      <tbody>
        {groupedData.map((student, idx) => (
          <tr key={idx} className="hover:bg-neutral-50/50 print:hover:bg-transparent">
            <td className="border border-neutral-300 text-center font-medium py-2">{startIndex + idx + 1}</td>
            <td className="border border-neutral-300 text-center font-semibold py-2">{student.name}</td>
            <td className="border border-neutral-300 text-center py-2">
              {formatGradeClass(student)}
            </td>
            {/* 상담구분 및 횟수 셀 (각 라인별 구분선 처리) */}
            <td className="border border-neutral-300 p-0 align-middle">
              <div>
                {student.types.map((t, tIdx) => (
                  <div 
                    key={tIdx} 
                    className="py-2 text-center border-b last:border-0 border-neutral-300 font-medium"
                  >
                    {t.typeName}
                  </div>
                ))}
              </div>
            </td>
            <td className="border border-neutral-300 p-0 align-middle">
              <div>
                {student.types.map((t, tIdx) => (
                  <div 
                    key={tIdx} 
                    className="py-2 text-center border-b last:border-0 border-neutral-300 font-semibold"
                  >
                    {t.count}회
                  </div>
                ))}
              </div>
            </td>
            <td className="border border-neutral-300 text-center py-2"></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
