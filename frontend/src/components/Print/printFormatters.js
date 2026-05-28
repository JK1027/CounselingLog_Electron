export const getSortText = (sortKey) => {
  switch (sortKey) {
    case 'date_desc':
      return '날짜 최신 순'
    case 'name_asc':
      return '이름 가나다 순'
    case 'sheet_asc':
      return '상담 유형 우선순위 순'
    case 'date_asc':
    default:
      return '날짜 오래된 순'
  }
}

export const getPeriodText = (startDate, endDate) => {
  if (!startDate && !endDate) return '전체 기간'

  const format = (d) => {
    if (!d || d.length !== 8) return ''
    return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`
  }

  const startStr = format(startDate) || '시작일 제한 없음'
  const endStr = format(endDate) || '종료일 제한 없음'
  return `${startStr} ~ ${endStr}`
}
