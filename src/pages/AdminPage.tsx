import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Profile } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../components/ui/Toast'

type AdminTab = 'users' | 'coins' | 'seats'

export default function AdminPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { toast } = useToast()
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [grantAmount, setGrantAmount] = useState('')
  const [grantNote, setGrantNote] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)

  useEffect(() => {
    if (!profile || profile.role !== 'super_admin') {
      navigate('/party')
    }
  }, [profile])

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    setLoading(true)
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50)
    if (search) q = q.ilike('username', `%${search}%`)
    const { data } = await q
    setUsers(data as Profile[] || [])
    setLoading(false)
  }

  const changeRole = async (userId: string, role: Profile['role']) => {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    toast(`Role updated to ${role}`, 'success')
    fetchUsers()
  }

  const banUser = async (userId: string, ban: boolean) => {
    await supabase.from('profiles').update({ is_banned: ban }).eq('id', userId)
    toast(ban ? 'User banned' : 'User unbanned', ban ? 'error' : 'success')
    fetchUsers()
  }

  const grantCoins = async () => {
    if (!selectedUser || !grantAmount) return
    const amount = parseInt(grantAmount)
    if (isNaN(amount) || amount <= 0) { toast('Invalid amount', 'error'); return }
    setGrantLoading(true)
    const { error } = await supabase.from('coin_transactions').insert({
      from_user_id: profile!.id,
      to_user_id: selectedUser.id,
      amount,
      transaction_type: 'admin_grant',
      note: grantNote || 'Admin grant',
    })
    if (!error) {
      await supabase
        .from('profiles')
        .update({ coins: (selectedUser.coins || 0) + amount })
        .eq('id', selectedUser.id)
      toast(`${amount} coins granted to ${selectedUser.display_name}`, 'success')
      setSelectedUser(null)
      setGrantAmount('')
      setGrantNote('')
      fetchUsers()
    } else {
      toast(error.message, 'error')
    }
    setGrantLoading(false)
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'coins', label: 'Grant Coins' },
    { key: 'seats', label: 'Seat Control' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, var(--purple-800) 0%, var(--purple-950) 50%)',
    }}>
      <header style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,215,0,0.12)',
        background: 'rgba(13, 0, 20, 0.7)',
        backdropFilter: 'blur(10px)',
      }}>
        <button
          onClick={() => navigate('/party')}
          style={{
            background: 'none', border: 'none', color: 'var(--neutral-400)',
            cursor: 'pointer', padding: '4px',
          }}
        >
          <BackIcon />
        </button>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            color: 'var(--gold-300)',
          }}>
            Super Admin Panel
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
            VIP Raja Controls
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{
          display: 'flex', gap: '4px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
          marginBottom: '24px',
        }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: tab === t.key
                  ? 'linear-gradient(135deg, var(--gold-600), var(--gold-300))'
                  : 'transparent',
                color: tab === t.key ? '#0a0a0a' : 'var(--neutral-400)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              placeholder="Search by username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '40px' }}>
                Loading...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {users.map(u => (
                  <div key={u.id} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <Avatar src={u.avatar_url} name={u.display_name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        {u.display_name}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                        @{u.username} · {u.coins} coins
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <RoleBadge role={u.role} />
                      {u.is_banned && (
                        <span style={{
                          background: 'rgba(239,68,68,0.2)',
                          color: '#ef4444',
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 600,
                        }}>
                          BANNED
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedUser(u)}
                        style={{
                          background: 'rgba(255,215,0,0.1)',
                          border: '1px solid rgba(255,215,0,0.3)',
                          color: 'var(--gold-300)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'coins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--neutral-400)', fontSize: '14px' }}>
              Select a user from the Users tab to grant coins, or search below.
            </p>
            <Input
              placeholder="Search user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.slice(0, 10).map(u => (
                <button
                  key={u.id}
                  onClick={() => { setTab('users'); setSelectedUser(u) }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,215,0,0.1)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Avatar src={u.avatar_url} name={u.display_name} size={36} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      {u.display_name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--gold-400)' }}>
                      {u.coins.toLocaleString()} coins
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'seats' && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--neutral-400)', fontSize: '14px', lineHeight: 1.8 }}>
              Seat controls are available directly in the Party Hall.<br/>
              Tap any occupied seat to mute, lock, or kick users.
            </p>
            <Button
              variant="gold"
              style={{ marginTop: '20px' }}
              onClick={() => navigate('/party')}
            >
              Go to Party Hall
            </Button>
          </div>
        )}
      </div>

      {selectedUser && (
        <Modal
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Manage: ${selectedUser.display_name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              padding: '12px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-md)',
            }}>
              <Avatar src={selectedUser.avatar_url} name={selectedUser.display_name} size={44} />
              <div>
                <p style={{ fontWeight: 600, color: '#fff' }}>{selectedUser.display_name}</p>
                <p style={{ fontSize: '12px', color: 'var(--neutral-400)' }}>
                  @{selectedUser.username} · {selectedUser.coins.toLocaleString()} coins
                </p>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '12px', color: 'var(--gold-200)', marginBottom: '8px' }}>
                Change Role
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['user', 'coin_seller', 'agency_owner', 'super_admin'] as Profile['role'][]).map(r => (
                  <button
                    key={r}
                    onClick={() => changeRole(selectedUser.id, r)}
                    style={{
                      background: selectedUser.role === r
                        ? 'rgba(255,215,0,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      border: selectedUser.role === r
                        ? '1px solid rgba(255,215,0,0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: selectedUser.role === r ? 'var(--gold-300)' : 'var(--neutral-300)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '12px', color: 'var(--gold-200)', marginBottom: '8px' }}>
                Grant Coins
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Input
                  placeholder="Amount (e.g. 1000)"
                  type="number"
                  value={grantAmount}
                  onChange={e => setGrantAmount(e.target.value)}
                />
                <Input
                  placeholder="Note (optional)"
                  value={grantNote}
                  onChange={e => setGrantNote(e.target.value)}
                />
                <Button
                  variant="gold"
                  fullWidth
                  loading={grantLoading}
                  onClick={grantCoins}
                >
                  Grant Coins
                </Button>
              </div>
            </div>

            <Button
              variant={selectedUser.is_banned ? 'outline' : 'danger'}
              fullWidth
              onClick={() => {
                banUser(selectedUser.id, !selectedUser.is_banned)
                setSelectedUser(null)
              }}
            >
              {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    super_admin: { bg: 'rgba(255,215,0,0.2)', color: 'var(--gold-300)' },
    coin_seller: { bg: 'rgba(16,185,129,0.2)', color: 'var(--success)' },
    agency_owner: { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa' },
    user: { bg: 'rgba(255,255,255,0.06)', color: 'var(--neutral-400)' },
  }
  const c = colors[role] || colors.user
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: '10px', padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {role.replace('_', ' ')}
    </span>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  )
}
