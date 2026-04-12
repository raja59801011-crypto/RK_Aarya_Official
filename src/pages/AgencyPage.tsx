import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Agency, AgencyEarning, Profile } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'

export default function AgencyPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { toast } = useToast()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [earnings, setEarnings] = useState<AgencyEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [agencyName, setAgencyName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [memberUsername, setMemberUsername] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const canCreateAgency = profile?.role === 'agency_owner' || profile?.role === 'super_admin'

  useEffect(() => {
    if (!profile) return
    fetchAgency()
  }, [profile?.id])

  const fetchAgency = async () => {
    setLoading(true)
    if (profile?.agency_id) {
      const { data: agencyData } = await supabase
        .from('agencies').select('*').eq('id', profile.agency_id).maybeSingle()
      setAgency(agencyData as Agency | null)

      if (agencyData) {
        const { data: membersData } = await supabase
          .from('profiles').select('*').eq('agency_id', agencyData.id)
        setMembers(membersData as Profile[] || [])

        const { data: earningsData } = await supabase
          .from('agency_earnings')
          .select('*, member:profiles(display_name, avatar_url, username)')
          .eq('agency_id', agencyData.id)
          .order('created_at', { ascending: false })
          .limit(20)
        setEarnings(earningsData as AgencyEarning[] || [])
      }
    } else if (profile?.role === 'agency_owner' || profile?.role === 'super_admin') {
      const { data: agencyData } = await supabase
        .from('agencies').select('*').eq('owner_id', profile.id).maybeSingle()
      if (agencyData) {
        setAgency(agencyData as Agency)
        const { data: membersData } = await supabase
          .from('profiles').select('*').eq('agency_id', agencyData.id)
        setMembers(membersData as Profile[] || [])
        const { data: earningsData } = await supabase
          .from('agency_earnings')
          .select('*, member:profiles(display_name, avatar_url, username)')
          .eq('agency_id', agencyData.id)
          .order('created_at', { ascending: false })
          .limit(20)
        setEarnings(earningsData as AgencyEarning[] || [])
      }
    }
    setLoading(false)
  }

  const createAgency = async () => {
    if (!agencyName.trim() || !profile) return
    setCreateLoading(true)
    const { data, error } = await supabase.from('agencies').insert({
      name: agencyName.trim(),
      owner_id: profile.id,
    }).select().maybeSingle()
    if (!error && data) {
      await supabase.from('profiles').update({ agency_id: data.id }).eq('id', profile.id)
      toast('Agency created!', 'success')
      setCreateOpen(false)
      setAgencyName('')
      await fetchAgency()
    } else {
      toast(error?.message || 'Failed', 'error')
    }
    setCreateLoading(false)
  }

  const addMember = async () => {
    if (!memberUsername.trim() || !agency) return
    setAddLoading(true)
    const { data: user } = await supabase
      .from('profiles').select('*').eq('username', memberUsername.trim().toLowerCase()).maybeSingle()
    if (!user) { toast('User not found', 'error'); setAddLoading(false); return }
    await supabase.from('profiles').update({ agency_id: agency.id }).eq('id', user.id)
    toast(`${user.display_name} added to agency`, 'success')
    setAddMemberOpen(false)
    setMemberUsername('')
    await fetchAgency()
    setAddLoading(false)
  }

  if (!profile) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, var(--purple-800) 0%, var(--purple-950) 50%)',
    }}>
      <header style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold-300)' }}>
          Agency Dashboard
        </h1>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '60px' }}>
            Loading...
          </div>
        ) : agency ? (
          <>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(30,64,175,0.1))',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏢</div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                color: '#fff',
                marginBottom: '6px',
              }}>
                {agency.name}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--neutral-400)', marginBottom: '20px' }}>
                {members.length} members
              </p>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <StatCard
                  label="Total Earnings"
                  value={`${agency.total_earnings.toLocaleString()} coins`}
                />
                <StatCard
                  label="Active Members"
                  value={String(members.length)}
                />
              </div>
            </div>

            {(agency.owner_id === profile.id || profile.role === 'super_admin') && (
              <Button
                variant="outline"
                fullWidth
                style={{ marginBottom: '24px' }}
                onClick={() => setAddMemberOpen(true)}
              >
                + Add Member
              </Button>
            )}

            <Section title="MEMBERS">
              {members.length === 0 ? (
                <p style={{ color: 'var(--neutral-600)', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                  No members yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <Avatar src={m.avatar_url} name={m.display_name} size={40} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{m.display_name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>@{m.username}</p>
                      </div>
                      {m.id === agency.owner_id && (
                        <span style={{
                          fontSize: '10px', color: 'var(--gold-300)',
                          background: 'rgba(255,215,0,0.1)',
                          padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        }}>
                          OWNER
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="EARNINGS HISTORY" style={{ marginTop: '24px' }}>
              {earnings.length === 0 ? (
                <p style={{ color: 'var(--neutral-600)', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                  No earnings recorded yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {earnings.map(e => (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(16,185,129,0.06)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(16,185,129,0.15)',
                    }}>
                      <Avatar
                        src={(e as any).member?.avatar_url}
                        name={(e as any).member?.display_name}
                        size={36}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {(e as any).member?.display_name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                          {new Date(e.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p style={{ color: 'var(--success)', fontWeight: 700, fontSize: '16px' }}>
                        +{e.coins_earned.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏢</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              color: '#fff',
              marginBottom: '10px',
            }}>
              No Agency
            </h2>
            <p style={{ color: 'var(--neutral-400)', fontSize: '14px', marginBottom: '28px' }}>
              {canCreateAgency
                ? 'Create your agency and start building your team'
                : 'You are not part of any agency yet. Ask an agency owner to add you.'}
            </p>
            {canCreateAgency && (
              <Button variant="gold" size="lg" onClick={() => setCreateOpen(true)}>
                Create Agency
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Agency">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Agency Name"
            placeholder="eg. RK Elite Agency"
            value={agencyName}
            onChange={e => setAgencyName(e.target.value)}
          />
          <Button variant="gold" fullWidth loading={createLoading} onClick={createAgency}>
            Create Agency
          </Button>
        </div>
      </Modal>

      <Modal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add Member">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Username"
            placeholder="@username"
            value={memberUsername}
            onChange={e => setMemberUsername(e.target.value)}
          />
          <Button variant="gold" fullWidth loading={addLoading} onClick={addMember}>
            Add to Agency
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '12px',
        color: 'var(--gold-400)',
        letterSpacing: '1px',
        marginBottom: '12px',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 'var(--radius-md)',
      padding: '14px',
    }}>
      <p style={{ fontSize: '11px', color: 'var(--neutral-400)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{value}</p>
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  )
}
