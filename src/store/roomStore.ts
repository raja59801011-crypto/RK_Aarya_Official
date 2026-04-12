import { create } from 'zustand'
import { supabase, Room, RoomSeat } from '../lib/supabase'

interface RoomState {
  room: Room | null
  seats: RoomSeat[]
  loading: boolean
  fetchRoom: () => Promise<void>
  fetchSeats: (roomId: string) => Promise<void>
  setSeats: (seats: RoomSeat[]) => void
  takeSeat: (roomId: string, seatNumber: number, userId: string) => Promise<void>
  leaveSeat: (roomId: string, seatNumber: number) => Promise<void>
  lockSeat: (seatId: string, locked: boolean) => Promise<void>
  muteSeat: (seatId: string, muted: boolean) => Promise<void>
  kickFromSeat: (seatId: string) => Promise<void>
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  seats: [],
  loading: false,

  fetchRoom: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at')
      .limit(1)
      .maybeSingle()
    set({ room: data as Room | null, loading: false })
  },

  fetchSeats: async (roomId: string) => {
    const { data } = await supabase
      .from('room_seats')
      .select('*, profile:profiles(*)')
      .eq('room_id', roomId)
      .order('seat_number')
    set({ seats: (data as RoomSeat[]) || [] })
  },

  setSeats: (seats) => set({ seats }),

  takeSeat: async (roomId: string, seatNumber: number, userId: string) => {
    const existing = get().seats.find(s => s.seat_number === seatNumber)
    if (existing) {
      await supabase
        .from('room_seats')
        .update({ user_id: userId, joined_at: new Date().toISOString(), is_muted: false })
        .eq('id', existing.id)
    } else {
      await supabase.from('room_seats').insert({
        room_id: roomId,
        seat_number: seatNumber,
        user_id: userId,
        joined_at: new Date().toISOString(),
      })
    }
    await get().fetchSeats(roomId)
  },

  leaveSeat: async (roomId: string, seatNumber: number) => {
    const seat = get().seats.find(s => s.seat_number === seatNumber)
    if (seat) {
      await supabase
        .from('room_seats')
        .update({ user_id: null, joined_at: null, is_muted: false })
        .eq('id', seat.id)
      await get().fetchSeats(roomId)
    }
  },

  lockSeat: async (seatId: string, locked: boolean) => {
    await supabase.from('room_seats').update({ is_locked: locked }).eq('id', seatId)
    const room = get().room
    if (room) await get().fetchSeats(room.id)
  },

  muteSeat: async (seatId: string, muted: boolean) => {
    await supabase.from('room_seats').update({ is_muted: muted }).eq('id', seatId)
    const room = get().room
    if (room) await get().fetchSeats(room.id)
  },

  kickFromSeat: async (seatId: string) => {
    await supabase
      .from('room_seats')
      .update({ user_id: null, joined_at: null, is_muted: false })
      .eq('id', seatId)
    const room = get().room
    if (room) await get().fetchSeats(room.id)
  },
}))
