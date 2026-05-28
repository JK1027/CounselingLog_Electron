import { useInitializeApp } from '@/hooks/useInitializeApp'
import { useUpdater } from '@/hooks/useUpdater'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'

export default function AppBootstrap({ children }) {
  // 앱 초기화 데이터 및 백업 디렉토리 갱신
  useInitializeApp()
  
  // 일렉트론 업데이트 리스너 바인딩
  useUpdater()
  
  // 전역 단축키 바인딩
  useGlobalShortcuts()

  return <>{children}</>
}
