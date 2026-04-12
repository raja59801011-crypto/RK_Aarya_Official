import React, { createContext, useContext, useState, useCallback } from 'react'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastCtx {
  toast: (message: string, type?: ToastItem['type']) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const colors: Record<string, string> = {
    success: 'var(--success)',
    error: 'var(--error)',
    info: 'var(--purple-400)',
    warning: 'var(--warning)',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 88, right: 16,
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 9999, maxWidth: 320,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'rgba(20, 0, 40, 0.95)',
            border: `1px solid ${colors[t.type]}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#fff',
            fontSize: '14px',
            boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
            animation: 'scaleIn 0.2s ease',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: colors[t.type],
              flexShrink: 0,
            }} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
