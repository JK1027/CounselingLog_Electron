import { useState, useEffect } from 'react'

function getSafeWidth(key, defaultValue, minVal, maxVal) {
  const saved = localStorage.getItem(key)
  if (saved) {
    const parsed = parseInt(saved, 10)
    if (Number.isFinite(parsed) && parsed >= minVal && parsed <= maxVal) {
      return parsed
    }
  }
  return defaultValue
}

export function useLayoutResize() {
  const [sidebarWidth, setSidebarWidth] = useState(() => 
    getSafeWidth('counseling_sidebar_width', 260, 200, 400)
  )
  const [editorWidth, setEditorWidth] = useState(() => 
    getSafeWidth('counseling_editor_width', 320, 280, 500)
  )
  const [resizing, setResizing] = useState(null)

  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e) => {
      if (resizing === 'sidebar') {
        const newWidth = Math.max(200, Math.min(400, e.clientX))
        setSidebarWidth(newWidth)
      } else if (resizing === 'editor') {
        const newWidth = Math.max(280, Math.min(500, window.innerWidth - e.clientX))
        setEditorWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (resizing === 'sidebar') {
        localStorage.setItem('counseling_sidebar_width', String(sidebarWidth))
      } else if (resizing === 'editor') {
        localStorage.setItem('counseling_editor_width', String(editorWidth))
      }
      setResizing(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing, sidebarWidth, editorWidth])

  return {
    sidebarWidth,
    editorWidth,
    resizing,
    setResizing
  }
}
