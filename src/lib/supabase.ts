import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'user' | 'coin_seller' | 'agency_owner' | 'super_admin'

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string
  phone: string | null
  coins: number
  role: UserRole
  agency_id: string | null
  is_profile_locked: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  description: string
  owner_id: string | null
  is_active: boolean
  max_seats: number
  created_at: string
}

export interface RoomSeat {
  id: string
  room_id: string
  seat_number: number
  user_id: string | null
  is_locked: boolean
  is_muted: boolean
  joined_at: string | null
  profile?: Profile
}

export interface CoinTransaction {
  id: string
  from_user_id: string
  to_user_id: string
  amount: number
  transaction_type: 'transfer' | 'gift' | 'purchase' | 'admin_grant'
  note: string
  created_at: string
  from_profile?: Profile
  to_profile?: Profile
}

export interface Agency {
  id: string
  name: string
  owner_id: string
  total_earnings: number
  created_at: string
}

export interface AgencyEarning {
  id: string
  agency_id: string
  member_id: string
  coins_earned: number
  period_start: string
  period_end: string | null
  created_at: string
  member?: Profile
}
