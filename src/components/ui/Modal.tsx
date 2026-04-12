import React, { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, children, maxWidth = 480 }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, var(--purple-900), var(--purple-800))',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          width: '100%',
          maxWidth,
          boxShadow: 'var(--shadow-elevated)',
          animation: 'scaleIn 0.25s ease',
        }}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              color: 'var(--gold-300)',
              letterSpacing: '0.5px',
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'var(--neutral-300)',
                width: 32, height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
                transition: 'background 0.2s',
              }}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
