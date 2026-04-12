import React from 'react'
import { Button } from '../ui/Button'

interface VoiceControlsProps {
  isMuted: boolean
  isJoined: boolean
  onToggleMute: () => void
  onLeave: () => void
}

export function VoiceControls({ isMuted, isJoined, onToggleMute, onLeave }: VoiceControlsProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    }}>
      <button
        onClick={onToggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
        style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: isMuted
            ? 'linear-gradient(135deg, #b91c1c, #ef4444)'
            : 'linear-gradient(135deg, var(--purple-600), var(--purple-500))',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isMuted
            ? '0 4px 20px rgba(239, 68, 68, 0.5)'
            : 'var(--shadow-purple)',
          transition: 'all 0.2s',
        }}
      >
        {isMuted ? <MicOffIcon /> : <MicIcon />}
      </button>

      {isJoined && (
        <button
          onClick={onLeave}
          title="Leave voice"
          style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            color: '#ef4444',
          }}
        >
          <PhoneOffIcon />
        </button>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 1c-1.7 0-3 1.3-3 3v8c0 1.7 1.3 3 3 3s3-1.3 3-3V4c0-1.7-1.3-3-3-3z"/>
      <path d="M5 10c0 4 3 7 7 7s7-3 7-7"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="2" y1="2" x2="22" y2="22"/>
      <path d="M12 1c-1.7 0-3 1.3-3 3v5l6-6V4c0-1.7-1.3-3-3-3z"/>
      <path d="M9 9v3c0 1.7 1.3 3 3 3s3-1.3 3-3v-.7"/>
      <path d="M5 10c0 4 3 7 7 7s5.3-1.9 6.5-4.8"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
    </svg>
  )
}

function PhoneOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="23" y1="1" x2="1" y2="23"/>
      <path d="M16.5 1h3a2 2 0 012 2v3a2 2 0 01-2 2H17"/>
      <path d="M7 8H4a2 2 0 01-2-2V3a2 2 0 012-2h3"/>
      <path d="M11.7 3.3C12.8 5 14 7 15 9"/>
      <path d="M9 16c2 1 4 2.3 6 3.3"/>
    </svg>
  )
}
