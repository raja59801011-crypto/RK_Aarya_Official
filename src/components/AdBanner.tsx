import React from 'react'

interface AdBannerProps {
  slot?: string
}

export function AdBanner({ slot = 'top' }: AdBannerProps) {
  return (
    <div style={{
      width: '100%',
      minHeight: 60,
      background: 'rgba(255,255,255,0.03)',
      border: '1px dashed rgba(255,215,0,0.1)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 60 }}
        data-ad-client="ca-pub-9952411839772191"
        data-ad-slot={slot === 'bottom' ? '2345678901' : '1234567890'}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.1)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>
        Advertisement
      </div>
    </div>
  )
}
