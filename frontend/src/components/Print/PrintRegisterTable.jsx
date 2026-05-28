export default function PrintRegisterTable({ printData }) {
  // 1. 학생별 그룹화 처리 (중복 제거 및 상담구분별 횟수 계산)
  const groupedData = []
  const seenKeys = new Map()

  printData.forEach((session) => {
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

  // 학년/반 포맷터
  const formatGradeClass = (student) => {
    const gradeText = student.grade ? `${student.grade}학년` : ''
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
            <td className="border border-neutral-300 text-center font-medium py-2">{idx + 1}</td>
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
