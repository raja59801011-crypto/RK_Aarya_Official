import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { ToastProvider } from './components/ui/Toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import PartyHallPage from './pages/PartyHallPage'
import AdminPage from './pages/AdminPage'
import WalletPage from './pages/WalletPage'
import AgencyPage from './pages/AgencyPage'

export default function App() {
  const { setUser, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, phone: session.user.phone, email: session.user.email })
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          setUser({ id: session.user.id, phone: session.user.phone, email: session.user.email })
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
      })()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile-setup" element={
            <ProtectedRoute><ProfileSetupPage /></ProtectedRoute>
          } />
          <Route path="/party" element={
            <ProtectedRoute><PartyHallPage /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute><AdminPage /></ProtectedRoute>
          } />
          <Route path="/me" element={
            <ProtectedRoute><WalletPage /></ProtectedRoute>
          } />
          <Route path="/agency" element={
            <ProtectedRoute><AgencyPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
