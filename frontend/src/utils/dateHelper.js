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

/**
 * 시작일과 종료일 범위에 맞춰 상담 세션 배열을 필터링합니다.
 * @param {Array} sessions 
 * @param {string} startDate YYYYMMDD
 * @param {string} endDate YYYYMMDD
 * @returns {Array} 필터링된 세션 배열 (새 배열 반환)
 */
export function filterSessionsByDateRange(sessions, startDate, endDate) {
  if (!sessions || !Array.isArray(sessions)) return [];
  
  const cleanStart = cleanDateString(startDate);
  const cleanEnd = cleanDateString(endDate);
  
  return sessions.filter(session => {
    if (!session || !session.date) return false;
    const sessionDate = cleanDateString(session.date);
    
    if (cleanStart && sessionDate < cleanStart) return false;
    if (cleanEnd && sessionDate > cleanEnd) return false;
    return true;
  });
}

/**
 * 이번 주의 시작일(월요일)과 종료일(일요일)을 YYYYMMDD 포맷으로 반환합니다.
 */
export function getThisWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0: 일요일, 1: 월요일, ...
  const diffToMonday = day === 0 ? -6 : 1 - day; // 월요일과의 차이
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDateObj = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  };
  
  return {
    start: formatDateObj(monday),
    end: formatDateObj(sunday)
  };
}

/**
 * 이번 달의 시작일(1일)과 종료일(말일)을 YYYYMMDD 포맷으로 반환합니다.
 */
export function getThisMonthRange() {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-indexed
  
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  
  const formatDateObj = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  };
  
  return {
    start: formatDateObj(firstDay),
    end: formatDateObj(lastDay)
  };
}

/**
 * 현재 학기(한국 학교 기준)의 시작일과 종료일을 YYYYMMDD 포맷으로 반환합니다.
 * - 1학기: 3월 1일 ~ 8월 31일
 * - 2학기: 9월 1일 ~ 익년 2월 28일/29일
 */
export function getThisSemesterRange() {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1; // 1-indexed (1 ~ 12)
  
  if (m >= 3 && m <= 8) {
    return {
      start: `${y}0301`,
      end: `${y}0831`
    };
  } else if (m >= 9 && m <= 12) {
    return {
      start: `${y}0901`,
      end: `${y + 1}0228`
    };
  } else {
    // 1월, 2월 (직전 연도 2학기에 해당)
    return {
      start: `${y - 1}0901`,
      end: `${y}0228`
    };
  }
}

