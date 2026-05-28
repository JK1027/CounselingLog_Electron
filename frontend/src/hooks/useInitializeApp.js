import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function useInitializeApp() {
  const { initialize, loadSettings } = useAppStore()

  useEffect(() => {
    loadSettings()
    initialize()
  }, [initialize, loadSettings])
}
