import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function useUpdater() {
  const { initializeUpdater } = useAppStore()

  useEffect(() => {
    const unsub = initializeUpdater()
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [initializeUpdater])
}
