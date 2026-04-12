import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    transition: 'all 0.2s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : undefined,
    border: 'none',
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: '13px', padding: '6px 14px', height: '32px' },
    md: { fontSize: '14px', padding: '10px 20px', height: '44px' },
    lg: { fontSize: '16px', padding: '14px 28px', height: '52px' },
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, var(--purple-600), var(--purple-500))',
      color: '#fff',
      boxShadow: '0 4px 16px rgba(136, 0, 230, 0.4)',
    },
    gold: {
      background: 'linear-gradient(135deg, var(--gold-600), var(--gold-300))',
      color: '#0a0a0a',
      boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--neutral-100)',
      border: '1px solid rgba(255,255,255,0.12)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--gold-300)',
      border: '1px solid var(--gold-500)',
    },
    danger: {
      background: 'linear-gradient(135deg, #b91c1c, #ef4444)',
      color: '#fff',
      boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
    },
  }

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      className={className}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
