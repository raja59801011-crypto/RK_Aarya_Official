import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

const AVATAR_PRESETS = [
  'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&w=100',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&w=100',
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&w=100',
  'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&w=100',
  'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&w=100',
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&w=100',
  'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&w=100',
  'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&w=100',
]

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, fetchProfile } = useAuthStore()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0])
  const [loading, setLoading] = useState(false)

  const save = async () => {
    if (!username.trim()) { toast('Username is required', 'error'); return }
    if (!displayName.trim()) { toast('Display name is required', 'error'); return }
    if (!user) { toast('Not authenticated', 'error'); return }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleanUsername.length < 3) { toast('Username must be at least 3 characters', 'error'); return }

    setLoading(true)
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      username: cleanUsername,
      display_name: displayName.trim(),
      avatar_url: avatarUrl,
      phone: user.phone || null,
      is_profile_locked: true,
    })
    setLoading(false)

    if (error) {
      if (error.code === '23505') toast('Username already taken', 'error')
      else toast(error.message, 'error')
      return
    }

    await fetchProfile(user.id)
    toast('Profile created!', 'success')
    navigate('/party')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, var(--purple-800) 0%, var(--purple-950) 60%)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'rgba(26, 0, 48, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-elevated)',
        animation: 'scaleIn 0.3s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            background: 'linear-gradient(135deg, var(--gold-300), var(--gold-200))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}>
            Create Your Profile
          </h1>
          <p style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>
            Profile is locked after saving
          </p>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gold-200)', marginBottom: '12px' }}>
            Choose Avatar
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
          }}>
            {AVATAR_PRESETS.map((url) => (
              <button
                key={url}
                onClick={() => setAvatarUrl(url)}
                style={{
                  padding: 0,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: avatarUrl === url
                    ? '3px solid var(--gold-300)'
                    : '3px solid transparent',
                  boxShadow: avatarUrl === url ? 'var(--shadow-gold)' : undefined,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  background: 'none',
                  aspectRatio: '1',
                }}
              >
                <img
                  src={url}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          <Input
            label="Username"
            placeholder="eg. vip_raja786"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <Input
            label="Display Name"
            placeholder="eg. VIP Raja Ji"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>

        <div style={{
          background: 'rgba(255, 193, 7, 0.08)',
          border: '1px solid rgba(255, 193, 7, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>🔒</span>
          <p style={{ fontSize: '12px', color: 'var(--gold-200)', lineHeight: 1.6 }}>
            Your profile will be permanently locked after saving. Choose your username carefully!
          </p>
        </div>

        <Button variant="gold" size="lg" fullWidth loading={loading} onClick={save}>
          Save & Enter Party Hall
        </Button>
      </div>
    </div>
  )
}
