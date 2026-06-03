import React, { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronRight, Sparkles, AlertCircle, RefreshCw, Clock, EyeOff } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { changelogData } from '@/data/changelogData'

export default function ChangelogModal() {
  const { changelogOpen, setChangelogOpen } = useAppStore()
  
  // 아코디언 상태 관리 (첫 번째는 기본 열림)
  const [openVersions, setOpenVersions] = useState({
    [changelogData[0]?.version]: true
  })

  if (!changelogOpen) return null

  const toggleAccordion = (version) => {
    setOpenVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }))
  }

  // 닫기 처리
  const handleClose = () => {
    setChangelogOpen(false)
  }

  // 하루 동안 보지 않음 처리
  const handleDismissToday = () => {
    const today = new Date().toDateString()
    localStorage.setItem('counseling_changelog_dismiss_today', today)
    setChangelogOpen(false)
  }

  // 다시 보지 않음 처리
  const handleDismissForever = () => {
    localStorage.setItem('counseling_changelog_dismiss_forever', 'true')
    setChangelogOpen(false)
  }

  // 카테고리 색상 및 아이콘 매핑
  const getCategoryStyles = (categoryName) => {
    switch (categoryName) {
      case '중요 업데이트':
        return {
          textColor: '#2563eb', // 차분한 파란색
          bgColor: '#eff6ff',
          borderColor: '#dbeafe',
          iconColor: '#3b82f6'
        }
      case '새로운 기능':
        return {
          textColor: '#6366f1', // 차분한 보라/인디고
          bgColor: '#eef2ff',
          borderColor: '#e0e7ff',
          iconColor: '#6366f1'
        }
      case '기능 개선':
        return {
          textColor: '#16a34a', // 차분한 녹색
          bgColor: '#f0fdf4',
          borderColor: '#dcfce7',
          iconColor: '#22c55e'
        }
      default:
        return {
          textColor: '#4b5563', // 회색
          bgColor: '#f9fafb',
          borderColor: '#f3f4f6',
          iconColor: '#9ca3af'
        }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center print-exclude animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-[520px] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col select-none"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          maxHeight: '85vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Sparkles size={20} className="text-accent" style={{ color: 'var(--accent)' }} />
              변경 사항
            </span>
          </div>
          <button
            onClick={handleClose}
            className="hover:bg-hover p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-[1px] w-full" style={{ backgroundColor: 'var(--border-light)' }} />

        {/* 본문 (아코디언) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[55vh]">
          {changelogData.map((item, index) => {
            const isOpen = !!openVersions[item.version]
            return (
              <div
                key={item.version}
                className="rounded-2xl border transition-all"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-secondary)'
                }}
              >
                {/* 아코디언 헤더 */}
                <div
                  className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-hover transition-colors rounded-t-2xl"
                  onClick={() => toggleAccordion(item.version)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChevronDown
                      size={16}
                      className="transition-transform duration-200"
                      style={{
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        color: 'var(--text-muted)'
                      }}
                    />
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-bold text-[13px] whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                        v{item.version}
                      </span>
                      <span className="text-[12px] font-medium text-neutral-400 dark:text-neutral-500 truncate">
                        — {item.title}
                      </span>
                      {index === 0 && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent animate-pulse shrink-0"
                          style={{ border: '1px solid var(--accent-soft)' }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap ml-2">
                    {item.date}
                  </span>
                </div>

                {/* 아코디언 콘텐츠 */}
                {isOpen && (
                  <div
                    className="p-4 pt-1 space-y-4 rounded-b-2xl"
                    style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)' }}
                  >
                    {item.categories.map((cat, catIdx) => {
                      const styles = getCategoryStyles(cat.name)
                      return (
                        <div key={catIdx} className="space-y-2">
                          {/* 카테고리 헤더 배지 */}
                          <div
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg border text-[11px] font-bold"
                            style={{
                              backgroundColor: styles.bgColor,
                              borderColor: styles.borderColor,
                              color: styles.textColor
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={11} style={{ color: styles.iconColor }} />
                              <span>{cat.name}</span>
                            </div>
                            <span className="text-[10px] font-medium opacity-80">{cat.count}건</span>
                          </div>

                          {/* 카테고리 내 리스트 */}
                          <div className="space-y-2.5 pl-1.5 pr-0.5">
                            {cat.items.map((subItem, subIdx) => (
                              <div key={subIdx} className="flex gap-2 text-xs leading-normal items-start group">
                                <ChevronRight
                                  size={12}
                                  className="mt-0.5 shrink-0"
                                  style={{ color: styles.textColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <span
                                    className="font-bold text-neutral-800 dark:text-neutral-200"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {subItem.title}
                                  </span>
                                  <span className="text-neutral-400 dark:text-neutral-500 mx-1.5">—</span>
                                  <span
                                    className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-all"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    {subItem.desc}
                                  </span>
                                </div>
                                {subItem.tag && (
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0"
                                    style={{
                                      backgroundColor: 'var(--bg-secondary)',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text-secondary)'
                                    }}
                                  >
                                    {subItem.tag}
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
            )
          })}
        </div>

        {/* 구분선 */}
        <div className="h-[1px] w-full" style={{ backgroundColor: 'var(--border-light)' }} />

        {/* 하단 푸터 버튼 */}
        <div className="p-4 px-6 flex items-center justify-between gap-3 shrink-0" style={{ background: 'var(--bg-secondary)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
          <div className="flex gap-2">
            <button
              onClick={handleDismissToday}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border hover:bg-hover cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)'
              }}
            >
              <Clock size={12} />
              하루 동안 보지 않음
            </button>
            <button
              onClick={handleDismissForever}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border hover:bg-hover cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)'
              }}
            >
              <EyeOff size={12} />
              다시 보지 않음
            </button>
          </div>
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:opacity-95 cursor-pointer"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 2px 8px var(--accent-glow)'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
