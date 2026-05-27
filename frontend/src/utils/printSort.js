import { cleanDateString } from './dateHelper'

const SHEET_ORDER = {
  '개인상담': 1,
  '집단상담': 2,
  '보호자상담': 3,
  '교원자문': 4,
  '의뢰': 5
}

/**
 * 상담 유형의 정렬 우선순위 값을 가져옵니다. (기본값: 99)
 */
function getSheetOrderValue(sheetType) {
  if (!sheetType) return 99
  const trimmed = String(sheetType).trim()
  return SHEET_ORDER[trimmed] || 99
}

/**
 * 정렬 기준에 따라 세션 데이터를 정렬하여 새 배열을 반환합니다.
 * @param {Array} sessions 
 * @param {string} sortBy 'date_asc' | 'date_desc' | 'name_asc' | 'sheet_asc'
 * @returns {Array} 정렬된 새로운 세션 배열
 */
export function sortPrintSessions(sessions, sortBy = 'date_asc') {
  if (!sessions || !Array.isArray(sessions)) return []
  
  // 원본 데이터 복사 (Immutability 보장)
  const cloned = [...sessions]

  return cloned.sort((a, b) => {
    // 예외 가드 및 정합성 보강 (normalize)
    const nameA = (a?.name || '').trim() || '집단상담'
    const nameB = (b?.name || '').trim() || '집단상담'
    
    const dateA = cleanDateString(a?.date)
    const dateB = cleanDateString(b?.date)

    switch (sortBy) {
      case 'date_desc':
        return dateB.localeCompare(dateA)

      case 'name_asc':
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB, 'ko')
        }
        // 이름이 같은 경우 날짜 오름차순 서브 정렬
        return dateA.localeCompare(dateB)

      case 'sheet_asc': {
        const orderA = getSheetOrderValue(a?.sheetType)
        const orderB = getSheetOrderValue(b?.sheetType)
        
        if (orderA !== orderB) {
          return orderA - orderB
        }
        // 상담유형이 같은 경우 날짜 오름차순 서브 정렬
        return dateA.localeCompare(dateB)
      }

      case 'date_asc':
      default:
        return dateA.localeCompare(dateB)
    }
  })
}
