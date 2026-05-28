import './index.css'
import './App.css'
import ToastContainer from '@/components/ui/ToastContainer'
import LoginScreen from '@/components/Login/LoginScreen'
import AppBootstrap from '@/components/app/AppBootstrap'
import AppShell from '@/components/app/AppShell'
import { useAppStore } from '@/store/useAppStore'

export default function App() {
  const { isAuthenticated } = useAppStore()

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    )
  }

  return (
    <AppBootstrap>
      <AppShell />
      <ToastContainer />
    </AppBootstrap>
  )
}
