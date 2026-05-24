/**
 * 또래상담 세부 활동 내용 및 학생 참석 현황을 받아 가공된 전체 본문 상세 텍스트를 구성합니다.
 * 
 * @param {string} detail - 작성한 활동내용 본문
 * @param {Array} attendedStudents - 참석 학생 리스트
 * @param {Array} absentStudents - 미참석 학생 리스트
 * @returns {string} 조립된 전체 세부 내용 텍스트
 */
export function buildPeerCounselContent(detail, attendedStudents, absentStudents) {
  const attendedText = attendedStudents.map(s => `${s.name}(${s.grade}-${s.class})`).join(', ')
  const absentText = absentStudents.map(s => `${s.name}(${s.grade}-${s.class})`).join('\n')

  return `${detail.trim()}

참여학생:
${attendedText || '없음'}

미참여학생:
${absentText || '없음'}`
}
