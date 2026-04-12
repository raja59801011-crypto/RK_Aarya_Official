import React, { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useRoomStore } from '../store/roomStore'
import { useAgora } from '../hooks/useAgora'
import { SeatGrid } from '../components/party/SeatGrid'
import { VoiceControls } from '../components/party/VoiceControls'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { AdBanner } from '../components/AdBanner'

export default function PartyHallPage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { room, seats, fetchRoom, fetchSeats, takeSeat, leaveSeat, lockSeat, muteSeat, kickFromSeat } = useRoomStore()
  const { toast } = useToast()
  const channelName = room?.id?.slice(0, 16) || 'rk-room'
  const uid = profile ? Math.abs(profile.username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 999999) : 0
  const userSeat = seats.find(s => s.user_id === profile?.id)
  const isInSeat = !!userSeat
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const { isMuted, isJoined, remoteUsers, toggleMute, leave: leaveVoice } = useAgora({
    channel: channelName,
    uid,
    enabled: isInSeat,
  })

  useEffect(() => {
    fetchRoom()
  }, [])

  useEffect(() => {
    if (!room) return
    fetchSeats(room.id)
    const ch = supabase.channel(`room_seats:${room.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_seats',
        filter: `room_id=eq.${room.id}`,
      }, () => { fetchSeats(room.id) })
      .subscribe()
    subRef.current = ch
    return () => { ch.unsubscribe() }
  }, [room?.id])

  const handleTakeSeat = useCallback(async (seatNumber: number) => {
    if (!room || !profile) return
    if (profile.is_banned) { toast('You are banned from this room', 'error'); return }
    await takeSeat(room.id, seatNumber, profile.id)
    toast('You joined seat ' + seatNumber, 'success')
  }, [room, profile])

  const handleLeaveSeat = useCallback(async (seatNumber: number) => {
    if (!room) return
    await leaveVoice()
    await leaveSeat(room.id, seatNumber)
    toast('You left the seat', 'info')
  }, [room])

  const onLeaveVoice = useCallback(async () => {
    if (userSeat) await handleLeaveSeat(userSeat.seat_number)
    else await leaveVoice()
  }, [userSeat, leaveVoice, handleLeaveSeat])

  const handleSignOut = async () => {
    if (userSeat) await handleLeaveSeat(userSeat.seat_number)
    await signOut()
    navigate('/login')
  }

  if (!profile) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, var(--purple-800) 0%, var(--purple-950) 50%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,215,0,0.12)',
        background: 'rgba(13, 0, 20, 0.6)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 28, height: 28 }}>
            <svg viewBox="0 0 24 24" fill="var(--gold-300)">
              <path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4-2 10z"/>
              <rect x="3" y="19" width="18" height="3" rx="1"/>
            </svg>
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              color: 'var(--gold-300)',
              lineHeight: 1,
            }}>
              {room?.name || 'RK Royal Club'}
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '2px' }}>
              {seats.filter(s => s.user_id).length}/15 Online
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {profile.role === 'super_admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              Admin
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate('/me')}>
            Wallet
          </Button>
          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Exit
          </button>
        </div>
      </header>

      <div style={{
        flex: 1,
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: 700,
        margin: '0 auto',
        width: '100%',
      }}>
        <AdBanner />

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,215,0,0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              color: 'var(--gold-400)',
              letterSpacing: '1px',
            }}>
              PARTY HALL
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 10px',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--success)',
                animation: 'pulse-gold 2s infinite',
              }} />
              <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          <SeatGrid
            seats={seats}
            currentUser={profile}
            onTakeSeat={handleTakeSeat}
            onLeaveSeat={handleLeaveSeat}
            onLockSeat={lockSeat}
            onMuteSeat={muteSeat}
            onKick={kickFromSeat}
            remoteUsers={remoteUsers}
          />
        </div>

        {isInSeat && (
          <div style={{
            background: 'rgba(26, 0, 48, 0.8)',
            border: '1px solid rgba(255,215,0,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--neutral-400)' }}>
                Seat #{userSeat?.seat_number}
              </p>
              <p style={{ fontSize: '14px', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                {isJoined ? 'Connected' : 'Connecting...'}
              </p>
            </div>
            <VoiceControls
              isMuted={isMuted}
              isJoined={isJoined}
              onToggleMute={toggleMute}
              onLeave={onLeaveVoice}
            />
          </div>
        )}

        <AdBanner slot="bottom" />
      </div>

      <nav style={{
        position: 'sticky', bottom: 0,
        background: 'rgba(13, 0, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,215,0,0.12)',
        display: 'flex',
        padding: '8px 0 4px',
      }}>
        {[
          { label: 'Party', icon: '🎵', path: '/party' },
          { label: 'Wallet', icon: '💰', path: '/me' },
          { label: 'Agency', icon: '🏢', path: '/agency' },
        ].map(tab => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', background: 'none', border: 'none',
              cursor: 'pointer', padding: '6px',
              color: location.pathname === tab.path ? 'var(--gold-300)' : 'var(--neutral-500)',
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
