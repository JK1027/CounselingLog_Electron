import { TAG_COLORS } from '@/data/mockData'

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
