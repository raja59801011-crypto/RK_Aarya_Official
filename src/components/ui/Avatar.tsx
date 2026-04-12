import React from 'react'

interface AvatarProps {
  src?: string
  name?: string
  size?: number
  isMuted?: boolean
  isSpeaking?: boolean
  isAdmin?: boolean
  style?: React.CSSProperties
}

export function Avatar({ src, name, size = 48, isMuted, isSpeaking, isAdmin, style }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      ...style,
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: isSpeaking
          ? '2px solid var(--gold-300)'
          : '2px solid rgba(255,255,255,0.15)',
        boxShadow: isSpeaking ? 'var(--shadow-gold)' : undefined,
        animation: isSpeaking ? 'pulse-gold 1.5s ease-in-out infinite' : undefined,
        background: src ? undefined : 'linear-gradient(135deg, var(--purple-600), var(--purple-400))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}>
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {isMuted && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.35,
          height: size * 0.35,
          minWidth: 14,
          minHeight: 14,
          background: 'var(--error)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--purple-900)',
        }}>
          <MuteIcon size={size * 0.2} />
        </div>
      )}
      {isAdmin && (
        <div style={{
          position: 'absolute',
          top: -4,
          right: -4,
          width: size * 0.38,
          height: size * 0.38,
          minWidth: 14,
          minHeight: 14,
        }}>
          <CrownIcon />
        </div>
      )}
    </div>
  )
}

function MuteIcon({ size }: { size: number }) {
  return (
    <svg width={Math.max(8, size)} height={Math.max(8, size)} viewBox="0 0 24 24" fill="none">
      <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 1c-1.7 0-3 1.3-3 3v5l6-6V4c0-1.7-1.3-3-3-3z" fill="white"/>
      <path d="M9 9v3c0 1.7 1.3 3 3 3s3-1.3 3-3v-.7L9 9z" fill="white"/>
      <path d="M5 10c0 4 3 7 7 7s7-3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="var(--gold-300)">
      <path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4-2 10z" />
      <rect x="3" y="19" width="18" height="3" rx="1" />
    </svg>
  )
}
