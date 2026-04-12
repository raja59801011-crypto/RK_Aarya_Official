import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--purple-950)',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{
          width: 56, height: 56,
          animation: 'float 2s ease-in-out infinite',
        }}>
          <svg viewBox="0 0 24 24" fill="var(--gold-300)">
            <path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4-2 10z"/>
            <rect x="3" y="19" width="18" height="3" rx="1"/>
          </svg>
        </div>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(255,215,0,0.2)',
          borderTopColor: 'var(--gold-300)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
