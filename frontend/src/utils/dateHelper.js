/**
 * 날짜 문자열에서 숫자 이외의 모든 문자(예: -, ., / 등)를 제거합니다.
 * @param {string} inputStr 
 * @returns {string} 숫자만 남은 문자열
 */
export function cleanDateString(inputStr) {
  if (!inputStr) return '';
  return inputStr.replace(/[^0-9]/g, '');
}

/**
 * YYYYMMDD 형태의 날짜 문자열이 윤년과 월별 최대 일수를 포함해 유효한지 검사합니다.
 * @param {string} dateStr 
 * @returns {boolean} 유효 여부
 */
export function isValidYYYYMMDD(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  
  // 8자리 숫자 포맷인지 체크
  if (!/^\d{8}$/.test(dateStr)) return false;

  const y = parseInt(dateStr.substring(0, 4), 10);
  const m = parseInt(dateStr.substring(4, 6), 10);
  const d = parseInt(dateStr.substring(6, 8), 10);

  // 연도 범위 체크 (1900년 ~ 2100년 제한)
  if (y < 1900 || y > 2100) return false;

  // 월 범위 체크 (1월 ~ 12월)
  if (m < 1 || m > 12) return false;

  // 해당 월의 최대 일수 계산 (윤달 포함)
  // JavaScript Date 객체에서 month가 1-indexed일 때, new Date(y, m, 0)은 m월의 0번째 날(즉, m월 이전 달의 마지막 날)을 의미합니다.
  // 예: new Date(2026, 2, 0) -> 2026년 2월의 마지막 일자(28일)를 구함
  const maxDay = new Date(y, m, 0).getDate();

  // 일 범위 체크
  if (d < 1 || d > maxDay) return false;

  return true;
}

/**
 * 로컬 시스템 기준 오늘 날짜를 YYYYMMDD 포맷 문자열로 가져옵니다.
 * @returns {string} YYYYMMDD 포맷의 오늘 날짜
 */
export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
