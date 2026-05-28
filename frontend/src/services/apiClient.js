const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8765'

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const controller = new AbortController()
  
  // 쓰기 작업(POST, PUT, DELETE) 및 백업(/backup) 등의 요청은 20초(20000ms), 일반 조회 등은 8초(8000ms) 적용
  const isWriteOrBackup = 
    options.method === 'POST' || 
    options.method === 'PUT' || 
    options.method === 'DELETE' || 
    endpoint.includes('/backup')

  const timeoutMs = isWriteOrBackup ? 20000 : 8000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMsg = `API 요청 실패 (상태 코드: ${response.status})`
      try {
        const errData = await response.json()
        if (errData && errData.detail) {
          errorMsg = errData.detail
        }
      } catch (_) {
        // JSON parsing failed or detail not found
      }
      throw new Error(errorMsg)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 서버 상태를 확인해 주세요.')
    }
    throw error
  }
}
