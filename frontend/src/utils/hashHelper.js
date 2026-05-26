/**
 * 입력받은 문자열을 웹 표준 Web Crypto API를 사용하여 SHA-256 해시 스트링으로 변환합니다.
 * @param {string} message 
 * @returns {Promise<string>} 64자리 16진수 SHA-256 해시 문자열
 */
export async function sha256(message) {
  if (!message) return '';
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // 각 바이트를 16진수 문자열로 변환하고 2자리로 패딩 처리
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
