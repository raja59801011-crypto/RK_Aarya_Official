import React, { useState } from 'react'
import { RoomSeat, Profile } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface SeatGridProps {
  seats: RoomSeat[]
  currentUser: Profile
  onTakeSeat: (seatNumber: number) => void
  onLeaveSeat: (seatNumber: number) => void
  onLockSeat: (seatId: string, locked: boolean) => void
  onMuteSeat: (seatId: string, muted: boolean) => void
  onKick: (seatId: string) => void
  remoteUsers: number[]
}

const SUPER_ADMIN_SEAT = 3

export function SeatGrid({
  seats,
  currentUser,
  onTakeSeat,
  onLeaveSeat,
  onLockSeat,
  onMuteSeat,
  onKick,
  remoteUsers,
}: SeatGridProps) {
  const [selectedSeat, setSelectedSeat] = useState<RoomSeat | null>(null)
  const isAdmin = currentUser.role === 'super_admin'

  const getSeat = (num: number): RoomSeat => {
    return seats.find(s => s.seat_number === num) || {
      id: `virtual-${num}`,
      room_id: '',
      seat_number: num,
      user_id: null,
      is_locked: false,
      is_muted: false,
      joined_at: null,
    }
  }

  const userSeat = seats.find(s => s.user_id === currentUser.id)
  const isSpeaking = (seat: RoomSeat) =>
    seat.user_id !== null && remoteUsers.includes(seat.seat_number)

  const handleSeatClick = (seat: RoomSeat) => {
    if (seat.is_locked && !isAdmin) return
    if (seat.user_id === currentUser.id) {
      onLeaveSeat(seat.seat_number)
      return
    }
    if (seat.user_id && !isAdmin) return
    if (seat.user_id && isAdmin) {
      setSelectedSeat(seat)
      return
    }
    if (!userSeat) {
      onTakeSeat(seat.seat_number)
    }
  }

  const rows = [[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15]]

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
          }}>
            {row.map(num => {
              const seat = getSeat(num)
              const isCrown = num === SUPER_ADMIN_SEAT
              const isEmpty = !seat.user_id
              const isMe = seat.user_id === currentUser.id
              const occupied = !!seat.user_id

              return (
                <button
                  key={num}
                  onClick={() => handleSeatClick(seat)}
                  title={seat.is_locked ? 'Seat Locked' : occupied ? seat.profile?.display_name : 'Join Seat'}
                  style={{
                    background: isCrown
                      ? 'linear-gradient(145deg, rgba(255,215,0,0.15), rgba(180,135,0,0.1))'
                      : isMe
                        ? 'linear-gradient(145deg, rgba(136,0,230,0.3), rgba(100,0,180,0.2))'
                        : occupied
                          ? 'rgba(255,255,255,0.07)'
                          : 'rgba(255,255,255,0.04)',
                    border: isCrown
                      ? '1.5px solid rgba(255,215,0,0.5)'
                      : isMe
                        ? '1.5px solid var(--purple-400)'
                        : '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 6px',
                    cursor: seat.is_locked && !isAdmin ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    opacity: seat.is_locked && !isAdmin ? 0.5 : 1,
                    boxShadow: isCrown ? 'var(--shadow-gold)' : isMe ? 'var(--shadow-purple)' : undefined,
                    minHeight: '90px',
                    position: 'relative',
                  }}
                >
                  {isCrown && (
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      width: 20,
                      height: 20,
                    }}>
                      <svg viewBox="0 0 24 24" fill="var(--gold-300)">
                        <path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4-2 10z"/>
                        <rect x="3" y="19" width="18" height="3" rx="1"/>
                      </svg>
                    </div>
                  )}

                  {seat.is_locked && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      color: 'var(--neutral-500)', fontSize: '12px',
                    }}>
                      🔒
                    </div>
                  )}

                  {occupied && seat.profile ? (
                    <Avatar
                      src={seat.profile.avatar_url}
                      name={seat.profile.display_name}
                      size={40}
                      isMuted={seat.is_muted}
                      isSpeaking={isSpeaking(seat)}
                      isAdmin={isCrown && seat.user_id === seat.profile.id}
                    />
                  ) : (
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1.5px dashed rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.3)',
                      fontSize: '18px',
                    }}>
                      +
                    </div>
                  )}

                  <div style={{ width: '100%', textAlign: 'center' }}>
                    {occupied && seat.profile ? (
                      <p style={{
                        fontSize: '10px',
                        color: isCrown ? 'var(--gold-300)' : isMe ? 'var(--purple-200)' : 'var(--neutral-300)',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {isMe ? 'You' : seat.profile.display_name.split(' ')[0]}
                      </p>
                    ) : (
                      <p style={{
                        fontSize: '10px',
                        color: isCrown ? 'var(--gold-600)' : 'rgba(255,255,255,0.25)',
                      }}>
                        {isCrown ? 'VIP Seat' : `#${num}`}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {selectedSeat && isAdmin && (
        <Modal
          open={!!selectedSeat}
          onClose={() => setSelectedSeat(null)}
          title="Seat Controls"
          maxWidth={360}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: 'var(--neutral-300)', fontSize: '14px', marginBottom: '8px' }}>
              Managing: <strong style={{ color: 'var(--gold-300)' }}>
                {selectedSeat.profile?.display_name || 'User'}
              </strong>
            </p>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                onMuteSeat(selectedSeat.id, !selectedSeat.is_muted)
                setSelectedSeat(null)
              }}
            >
              {selectedSeat.is_muted ? 'Unmute User' : 'Mute User'}
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                onLockSeat(selectedSeat.id, !selectedSeat.is_locked)
                setSelectedSeat(null)
              }}
            >
              {selectedSeat.is_locked ? 'Unlock Seat' : 'Lock Seat'}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                onKick(selectedSeat.id)
                setSelectedSeat(null)
              }}
            >
              Kick From Seat
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
