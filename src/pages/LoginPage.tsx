import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits.startsWith('91') && digits.length <= 10) return '+91' + digits
    if (digits.startsWith('91')) return '+' + digits
    return '+' + digits
  }

  const sendOtp = async () => {
    if (phone.length < 10) { toast('Enter a valid phone number', 'error'); return }
    setLoading(true)
    const formatted = formatPhone(phone)
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    setLoading(false)
    if (error) { toast(error.message, 'error'); return }
    toast('OTP sent!', 'success')
    setStep('otp')
  }

  const verifyOtp = async () => {
    if (otp.length < 4) { toast('Enter the OTP', 'error'); return }
    setLoading(true)
    const formatted = formatPhone(phone)
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    })
    setLoading(false)
    if (error) { toast(error.message, 'error'); return }
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()
      if (!profile) navigate('/profile-setup')
      else navigate('/party')
    }
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
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60vw', height: '60vw', maxWidth: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(136,0,230,0.15), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '50vw', height: '50vw', maxWidth: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(26, 0, 48, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-elevated)',
        animation: 'scaleIn 0.3s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 80, height: 80,
            margin: '0 auto 20px',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="crownGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffd700"/>
                  <stop offset="100%" stopColor="#c99600"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <polygon points="10,80 10,28 32,50 50,8 68,50 90,28 90,80"
                fill="url(#crownGrad)" filter="url(#glow)" />
              <rect x="8" y="78" width="84" height="16" rx="4"
                fill="url(#crownGrad)" filter="url(#glow)" />
              <circle cx="10" cy="28" r="7" fill="url(#crownGrad)" filter="url(#glow)"/>
              <circle cx="50" cy="8" r="7" fill="url(#crownGrad)" filter="url(#glow)"/>
              <circle cx="90" cy="28" r="7" fill="url(#crownGrad)" filter="url(#glow)"/>
              <circle cx="30" cy="72" r="4" fill="rgba(255,255,255,0.6)"/>
              <circle cx="50" cy="72" r="4" fill="rgba(255,255,255,0.6)"/>
              <circle cx="70" cy="72" r="4" fill="rgba(255,255,255,0.6)"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            background: 'linear-gradient(135deg, var(--gold-300), var(--gold-200))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            letterSpacing: '1px',
          }}>
            RK Group
          </h1>
          <p style={{ color: 'var(--neutral-400)', fontSize: '14px' }}>
            Royal Voice Chat Experience
          </p>
        </div>

        {step === 'phone' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              prefix={<PhoneIcon />}
            />
            <Button variant="gold" size="lg" fullWidth loading={loading} onClick={sendOtp}>
              Send OTP
            </Button>
            <p style={{
              textAlign: 'center', fontSize: '12px',
              color: 'var(--neutral-500)', lineHeight: 1.6,
            }}>
              By continuing you agree to our Terms of Service
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: 'var(--neutral-400)', fontSize: '14px', textAlign: 'center' }}>
              OTP sent to {phone}
            </p>
            <Input
              label="Enter OTP"
              type="text"
              placeholder="------"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
            />
            <Button variant="gold" size="lg" fullWidth loading={loading} onClick={verifyOtp}>
              Verify & Enter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => { setStep('phone'); setOtp('') }}
            >
              Change Number
            </Button>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '24px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 16px',
        fontSize: '11px',
        color: 'var(--neutral-500)',
      }}>
        Powered by Agora & Supabase
      </div>
    </div>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  )
}
