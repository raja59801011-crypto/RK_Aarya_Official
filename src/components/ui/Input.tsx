import React from 'react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export function Input({ label, error, prefix, suffix, style, className = '', ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--gold-200)',
          letterSpacing: '0.5px',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: '12px',
            color: 'var(--neutral-400)',
            display: 'flex', alignItems: 'center',
          }}>
            {prefix}
          </span>
        )}
        <input
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: error ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--neutral-50)',
            fontSize: '15px',
            padding: prefix ? '12px 12px 12px 40px' : '12px 16px',
            paddingRight: suffix ? '44px' : '16px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            outline: 'none',
            ...style,
          }}
          className={className}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--gold-500)'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 215, 0, 0.15)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? 'var(--error)' : 'rgba(255,255,255,0.12)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: '12px',
            color: 'var(--neutral-400)',
            display: 'flex', alignItems: 'center',
          }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--error)' }}>{error}</span>
      )}
    </div>
  )
}
