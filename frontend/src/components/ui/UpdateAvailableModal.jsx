import { Sparkles, X, Download, AlertTriangle, TrendingUp, Wrench, CheckCircle2, EyeOff } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function UpdateAvailableModal() {
  const {
    showUpdateAvailableModal,
    setShowUpdateAvailableModal,
    newVersionInfo,
    appVersion,
    dismissUpdateVersion,
    setUpdateStatus
  } = useAppStore()

  // 모달이 비활성화 상태이거나 새 버전 정보가 없으면 렌더링 안 함
  if (!showUpdateAvailableModal || !newVersionInfo) return null

  const currentVerStr = appVersion || 'v0.0.0'
  const newVerStr = `v${newVersionInfo.version}`

  // 한국어 표준 일자 포맷터
  const formatDateKorean = (dateStr) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return null
      return `출시일: ${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    } catch (e) {
      return null
    }
  }

  // 릴리즈 노트 유연 파서
  const parseReleaseNotes = (notes) => {
    if (!notes) return []
    
    let notesText = ''
    if (Array.isArray(notes)) {
      notesText = notes.map(n => typeof n === 'string' ? n : (n.note || '')).join('\n')
    } else if (typeof notes === 'string') {
      notesText = notes
    } else {
      notesText = String(notes)
    }

    const lines = notesText.split('\n')
    const sections = []
    let currentSection = null
    let currentItem = null

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (!trimmed) continue

      // 카테고리 헤더 감지 (## 중요 업데이트, ### 새로운 기능 등)
      const headerMatch = trimmed.match(/^(?:##|###)\s*(.*)$/)
      if (headerMatch) {
        const title = headerMatch[1].trim()
        currentSection = {
          title: title,
          items: []
        }
        sections.push(currentSection)
        currentItem = null
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        // 리스트 항목 감지
        const content = trimmed.replace(/^[-*]\s*/, '').trim()
        const colonIndex = content.indexOf(':')
        let itemTitle = content
        let itemDesc = ''
        if (colonIndex !== -1) {
          itemTitle = content.substring(0, colonIndex).trim()
          itemDesc = content.substring(colonIndex + 1).trim()
        }

        currentItem = {
          title: itemTitle,
          description: itemDesc
        }

        if (currentSection) {
          currentSection.items.push(currentItem)
        } else {
          currentSection = {
            title: "업데이트 내용",
            items: [currentItem]
          }
          sections.push(currentSection)
        }
      } else if (currentItem) {
        // 설명 부분 멀티라인 연결
        currentItem.description += ' ' + trimmed
      } else {
        // 일반 텍스트는 Fallback 항목으로 추가
        currentSection = {
          title: "업데이트 내용",
          items: [{ title: trimmed, description: "" }]
        }
        sections.push(currentSection)
      }
    }

    // 파싱된 항목의 유효성 검증 (실제 파싱된 item이 없는 경우 빈 배열 처리)
    const totalItems = sections.reduce((acc, sec) => acc + sec.items.length, 0)
    if (totalItems === 0) return []

    return sections
  }

  // 카테고리별 스타일 및 아이콘 매핑
  const getSectionStyle = (title) => {
    const t = title.toLowerCase()
    if (t.includes('중요') || t.includes('critical') || t.includes('important') || t.includes('경고')) {
      return {
        Icon: AlertTriangle,
        iconColor: '#e11d48', // rose-600
        bgColor: '#ffe4e6'   // rose-100
      }
    }
    if (t.includes('새') || t.includes('기능') || t.includes('new') || t.includes('feature')) {
      return {
        Icon: Sparkles,
        iconColor: '#2563eb', // blue-600
        bgColor: '#dbeafe'   // blue-100
      }
    }
    if (t.includes('개선') || t.includes('사항') || t.includes('improve') || t.includes('performance')) {
      return {
        Icon: TrendingUp,
        iconColor: '#16a34a', // green-600
        bgColor: '#dcfce7'   // green-100
      }
    }
    if (t.includes('버그') || t.includes('수정') || t.includes('fix') || t.includes('bug')) {
      return {
        Icon: Wrench,
        iconColor: '#7c3aed', // violet-600
        bgColor: '#ede9fe'   // violet-100
      }
    }
    return {
      Icon: CheckCircle2,
      iconColor: '#0891b2', // cyan-600
      bgColor: '#ecfeff'   // cyan-100
    }
  }

  // 릴리즈 노트 파싱 실행 및 필터링
  const parsedSections = parseReleaseNotes(newVersionInfo.releaseNotes).filter(s => s.items.length > 0)
  const isFallback = parsedSections.length === 0

  // 업데이트 다운로드 시작 (건너뛰지 않음)
  const handleDownload = () => {
    if (window.updaterAPI) {
      setUpdateStatus('downloading')
      window.updaterAPI.downloadUpdate()
      setShowUpdateAvailableModal(false)
    }
  }

  // 이번 버전 건너뛰기 (dismissedVersion 마킹 처리)
  const handleDecline = () => {
    dismissUpdateVersion(newVersionInfo.version)
  }

  // 단순 닫기 (X 클릭 / 배경 클릭 - 다음 기동 시 다시 띄움)
  const handleClose = () => {
    setShowUpdateAvailableModal(false)
  }

  const dateText = formatDateKorean(newVersionInfo.releaseDate)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center print-exclude animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-[440px] rounded-[24px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-4 select-none"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 닫기 (X 버튼) */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 hover:bg-hover p-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>

        {/* 헤더: 다운로드 배지 및 타이틀 */}
        <div className="flex items-center gap-4.5 pt-1.5 pb-1">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-soft)' }}
          >
            <Download size={20} className="text-accent" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              새 버전이 출시되었습니다
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>현재 버전 {currentVerStr}</span>
              <span className="text-[9px]">•</span>
              <span className="font-semibold text-accent" style={{ color: 'var(--accent)' }}>최신 버전 {newVerStr}</span>
            </div>
          </div>
        </div>

        {/* 릴리즈 메인 타이틀 */}
        {newVersionInfo.releaseName && (
          <div className="px-1 text-sm font-bold text-neutral-800 dark:text-neutral-200" style={{ color: 'var(--text-primary)' }}>
            {newVersionInfo.releaseName}
          </div>
        )}

        {/* 릴리즈 노트 바디 (스크롤 한도 적용) */}
        <div className="px-1">
          {isFallback ? (
            // 파싱 실패 시 원문 Fallback 렌더링
            <div 
              className="p-4 rounded-xl border text-xs leading-relaxed max-h-[220px] overflow-y-auto"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-primary)'
              }}
            >
              <pre 
                className="font-sans whitespace-pre-wrap break-words leading-relaxed text-neutral-600 dark:text-neutral-400"
                style={{ color: 'var(--text-secondary)' }}
              >
                {typeof newVersionInfo.releaseNotes === 'string'
                  ? newVersionInfo.releaseNotes
                  : JSON.stringify(newVersionInfo.releaseNotes, null, 2)}
              </pre>
            </div>
          ) : (
            // 파싱 성공 시 타임라인 형식 렌더링
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {parsedSections.map((section, sIdx) => {
                const { Icon, iconColor, bgColor } = getSectionStyle(section.title)
                return (
                  <div key={sIdx} className="relative pl-8 pb-1.5">
                    {/* 카테고리 간 세로 연결 라인 */}
                    {sIdx < parsedSections.length - 1 && (
                      <div 
                        className="absolute left-[13px] top-[26px] bottom-0 w-[2px]" 
                        style={{ backgroundColor: 'var(--border-light)' }} 
                      />
                    )}
                    
                    {/* 카테고리별 차등 원형 아이콘 */}
                    <div 
                      className="absolute left-0 top-0.5 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: bgColor }}
                    >
                      <Icon size={12} style={{ color: iconColor }} />
                    </div>

                    {/* 카테고리 타이틀 */}
                    <h4 
                      className="text-[11px] font-extrabold tracking-wider uppercase mb-2 text-neutral-400" 
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {section.title}
                    </h4>

                    {/* 카테고리 내부 항목 목록 */}
                    <div className="space-y-3">
                      {section.items.map((item, iIdx) => (
                        <div key={iIdx} className="text-xs leading-normal">
                          <span 
                            className="block font-bold text-neutral-700 dark:text-neutral-300"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.title}
                          </span>
                          {item.description && (
                            <span 
                              className="block text-[11px] mt-0.5 leading-relaxed text-neutral-500 dark:text-neutral-400"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {item.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 출시일 표기 */}
        {dateText && (
          <div className="px-1 text-[11px] text-neutral-400 font-medium" style={{ color: 'var(--text-muted)' }}>
            {dateText}
          </div>
        )}

        {/* 하단 버튼 영역 (Flex 가변 비율 대응) */}
        <div className="flex gap-2.5 mt-1.5 pb-0.5">
          {/* 업데이트 다운로드 (주 버튼 - 약 70%) */}
          <button
            onClick={handleDownload}
            className="flex-[2.3] flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer hover:opacity-95"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 4px 14px rgba(75,142,241,0.35)',
            }}
          >
            <Download size={13} />
            업데이트 다운로드
          </button>

          {/* 이번 버전 건너뛰기 (보조 버튼 - 약 30%) */}
          <button
            onClick={handleDecline}
            className="flex-[1] flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer border hover:bg-hover"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            <EyeOff size={12} />
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  )
}
