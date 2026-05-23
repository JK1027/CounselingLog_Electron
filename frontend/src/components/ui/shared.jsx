import { TAG_COLORS } from '@/data/mockData'
import { useAppStore } from '@/store/useAppStore'

export function TagBadge({ type }) {
  const colorClass = TAG_COLORS[type] || TAG_COLORS['default']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {type}
    </span>
  )
}

export function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr
  return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`
}

export function Avatar({ name, size = 'md', selected = false }) {
  const sizes = { xs: 'w-5 h-5 text-[9px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const colors = [
    'bg-violet-100 text-violet-600',
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-orange-100 text-orange-600',
    'bg-pink-100 text-pink-600',
    'bg-cyan-100 text-cyan-600'
  ]
  const color = selected 
    ? 'bg-white text-blue-600 shadow-sm border border-blue-100' 
    : colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold shrink-0 transition-all`}>
      {name[0]}
    </div>
  )
}

export function SaveStateIndicator() {
  const { saveState } = useAppStore()

  if (saveState === 'idle') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium select-none">
        <span className="w-2 h-2 rounded-full bg-neutral-300 transition-all duration-300" />
        <span>대기 중</span>
      </div>
    )
  }

  if (saveState === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-500 font-semibold select-none">
        <div className="flex h-2 w-2">
          <span className="animate-pulse inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </div>
        <span>저장 중...</span>
      </div>
    )
  }

  if (saveState === 'saved') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold select-none">
        <span className="w-2 h-2 rounded-full bg-green-500 transition-all duration-300" />
        <span>저장 완료</span>
      </div>
    )
  }

  if (saveState === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold select-none">
        <span className="w-2 h-2 rounded-full bg-red-500 transition-all duration-300" />
        <span>저장 실패</span>
      </div>
    )
  }

  return null
}

