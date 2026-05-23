import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }) {
  const isSuccess = toast.type === 'success'

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-md border animate-toast-slide-in transition-all duration-300"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: isSuccess ? 'rgba(52, 199, 133, 0.25)' : 'rgba(242, 104, 104, 0.25)',
        borderLeft: isSuccess ? '4px solid var(--green)' : '4px solid var(--red)',
      }}
    >
      <div className="shrink-0 mt-0.5">
        {isSuccess ? (
          <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
        ) : (
          <AlertCircle size={16} style={{ color: 'var(--red)' }} />
        )}
      </div>
      <div className="flex-1 text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}

