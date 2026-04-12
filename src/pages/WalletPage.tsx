import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, CoinTransaction, Profile } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../components/ui/Toast'

export default function WalletPage() {
  const navigate = useNavigate()
  const { profile, fetchProfile } = useAuthStore()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [targetUserId, setTargetUserId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [targetUser, setTargetUser] = useState<Profile | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  const canTransfer = profile?.role === 'coin_seller' || profile?.role === 'super_admin'

  useEffect(() => {
    if (!profile) return
    fetchTransactions()
  }, [profile?.id])

  const fetchTransactions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('coin_transactions')
      .select('*, from_profile:profiles!from_user_id(display_name, avatar_url, username), to_profile:profiles!to_user_id(display_name, avatar_url, username)')
      .or(`from_user_id.eq.${profile!.id},to_user_id.eq.${profile!.id}`)
      .order('created_at', { ascending: false })
      .limit(30)
    setTransactions(data as CoinTransaction[] || [])
    setLoading(false)
  }

  const lookupUser = async () => {
    if (!targetUserId.trim()) return
    setLookupLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', targetUserId.trim().toLowerCase())
      .maybeSingle()
    setLookupLoading(false)
    if (!data) { toast('User not found', 'error'); setTargetUser(null); return }
    setTargetUser(data as Profile)
  }

  const doTransfer = async () => {
    if (!profile || !targetUser) return
    const amount = parseInt(transferAmount)
    if (isNaN(amount) || amount <= 0) { toast('Invalid amount', 'error'); return }
    if (amount > profile.coins) { toast('Insufficient coins', 'error'); return }
    if (targetUser.id === profile.id) { toast('Cannot transfer to yourself', 'error'); return }

    setTransferLoading(true)
    const { error } = await supabase.from('coin_transactions').insert({
      from_user_id: profile.id,
      to_user_id: targetUser.id,
      amount,
      transaction_type: 'transfer',
      note: transferNote || 'Coin transfer',
    })

    if (!error) {
      await supabase.from('profiles').update({ coins: profile.coins - amount }).eq('id', profile.id)
      await supabase.from('profiles').update({ coins: (targetUser.coins || 0) + amount }).eq('id', targetUser.id)
      await fetchProfile(profile.id)
      await fetchTransactions()
      toast(`${amount} coins sent to ${targetUser.display_name}!`, 'success')
      setTransferOpen(false)
      setTargetUserId('')
      setTransferAmount('')
      setTransferNote('')
      setTargetUser(null)
    } else {
      toast(error.message, 'error')
    }
    setTransferLoading(false)
  }

  if (!profile) return null

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
          style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer' }}
        >
          <BackIcon />
        </button>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          color: 'var(--gold-300)',
        }}>
          My Wallet
        </h1>
      </header>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(180,100,0,0.08))',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-gold)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'scaleIn 0.3s ease',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(255,215,0,0.05), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ marginBottom: '8px' }}>
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name}
              size={56}
              style={{ margin: '0 auto 16px' }}
            />
            <p style={{ fontSize: '13px', color: 'var(--gold-400)', letterSpacing: '1px' }}>
              COIN BALANCE
            </p>
          </div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--gold-300), var(--gold-200))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: '4px',
          }}>
            {(profile.coins || 0).toLocaleString()}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--neutral-500)' }}>
            @{profile.username}
          </p>

          <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <RoleBadge role={profile.role} />
          </div>
        </div>

        {canTransfer && (
          <Button
            variant="gold"
            fullWidth
            size="lg"
            style={{ marginBottom: '24px' }}
            onClick={() => setTransferOpen(true)}
          >
            Transfer Coins
          </Button>
        )}

        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            color: 'var(--gold-400)',
            letterSpacing: '1px',
            marginBottom: '16px',
          }}>
            TRANSACTION HISTORY
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '40px' }}>
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              color: 'var(--neutral-600)', fontSize: '14px',
            }}>
              No transactions yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map(tx => {
                const isReceived = tx.to_user_id === profile.id
                const other = isReceived ? (tx as any).from_profile : (tx as any).to_profile
                return (
                  <div key={tx.id} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isReceived ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{
                      width: 36, height: 36,
                      borderRadius: '50%',
                      background: isReceived ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0,
                    }}>
                      {isReceived ? '↓' : '↑'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        {isReceived ? `From ${other?.display_name || 'Unknown'}` : `To ${other?.display_name || 'Unknown'}`}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                        {tx.note}
                      </p>
                    </div>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: isReceived ? 'var(--success)' : '#ef4444',
                      flexShrink: 0,
                    }}>
                      {isReceived ? '+' : '-'}{tx.amount.toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {transferOpen && (
        <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Coins">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Recipient Username"
                  placeholder="@username"
                  value={targetUserId}
                  onChange={e => { setTargetUserId(e.target.value); setTargetUser(null) }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  variant="outline"
                  size="md"
                  loading={lookupLoading}
                  onClick={lookupUser}
                >
                  Find
                </Button>
              </div>
            </div>

            {targetUser && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
              }}>
                <Avatar src={targetUser.avatar_url} name={targetUser.display_name} size={36} />
                <div>
                  <p style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{targetUser.display_name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>@{targetUser.username}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ color: 'var(--success)', fontSize: '18px' }}>✓</span>
                </div>
              </div>
            )}

            <Input
              label="Amount"
              type="number"
              placeholder="Enter coins to transfer"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
            />
            <Input
              label="Note (optional)"
              placeholder="Gift, payment, etc."
              value={transferNote}
              onChange={e => setTransferNote(e.target.value)}
            />

            <Button
              variant="gold"
              fullWidth
              size="lg"
              disabled={!targetUser}
              loading={transferLoading}
              onClick={doTransfer}
            >
              Send Coins
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'var(--gold-300)' },
    coin_seller: { label: 'Coin Seller', color: 'var(--success)' },
    agency_owner: { label: 'Agency Owner', color: '#60a5fa' },
    user: { label: 'Member', color: 'var(--neutral-400)' },
  }
  const m = map[role] || map.user
  return (
    <span style={{
      background: 'rgba(255,255,255,0.06)',
      color: m.color,
      fontSize: '11px',
      padding: '4px 12px',
      borderRadius: 'var(--radius-full)',
      fontWeight: 600,
      border: `1px solid ${m.color}33`,
    }}>
      {m.label}
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
