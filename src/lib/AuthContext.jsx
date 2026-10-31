import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

// ── Guest session helpers ─────────────────────────────────────────────────────
const GUEST_KEY = 'trustbreak_guest_session'

function buildGuestUser() {
  return {
    id: `guest-${Date.now()}`,
    email: null,
    isGuest: true,
    user_metadata: { full_name: 'Guest Analyst' },
    created_at: new Date().toISOString(),
  }
}

function getStoredGuest() {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY) || localStorage.getItem(GUEST_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveGuest(u) {
  try {
    sessionStorage.setItem(GUEST_KEY, JSON.stringify(u))
    localStorage.setItem(GUEST_KEY, JSON.stringify(u))
  } catch {}
}

function clearGuest() {
  try {
    sessionStorage.removeItem(GUEST_KEY)
    localStorage.removeItem(GUEST_KEY)
    // also clear legacy keys
    localStorage.removeItem('trustbreak_guest_session_active')
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [supabaseUser, setSupabaseUser] = useState(null)
  const [guestUser, setGuestUser] = useState(() => getStoredGuest())
  const [loading, setLoading] = useState(true)

  // Auth modal state — centralised so any component can open it
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('signin') // 'signin' | 'signup'

  // Onboarding
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    try { return localStorage.getItem('trustbreak_has_seen_onboarding') === 'true' } catch { return false }
  })

  // ── Supabase session listener ──────────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        clearGuest()
        setGuestUser(null)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        clearGuest()
        setGuestUser(null)
      } else {
        setSupabaseUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Derived state ──────────────────────────────────────────────────────────
  // The "active" user object — real auth takes priority over guest
  const user = supabaseUser || guestUser
  const isGuest = !supabaseUser && !!guestUser
  const isAuthenticated = !!supabaseUser

  // ── Auth Modal Controls ────────────────────────────────────────────────────
  const openSignIn = useCallback(() => {
    setAuthModalMode('signin')
    setAuthModalOpen(true)
  }, [])

  const openSignUp = useCallback(() => {
    setAuthModalMode('signup')
    setAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
  }, [])

  // ── Auth Actions ───────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }, [])

  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || email.split('@')[0] } },
    })
    if (error) throw error
    // Supabase may return user even without email confirmation depending on project settings
    return data.user
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {})
    clearGuest()
    setSupabaseUser(null)
    setGuestUser(null)
  }, [])

  const continueAsGuest = useCallback(() => {
    const g = buildGuestUser()
    saveGuest(g)
    setGuestUser(g)
    return g
  }, [])

  // ── Onboarding ─────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true)
    try { localStorage.setItem('trustbreak_has_seen_onboarding', 'true') } catch {}
  }, [])

  const resetOnboarding = useCallback(() => {
    setHasSeenOnboarding(false)
    try { localStorage.removeItem('trustbreak_has_seen_onboarding') } catch {}
  }, [])

  // ── Legacy / compat stubs ──────────────────────────────────────────────────
  const requestPasswordReset = async () => true
  const sendEmailVerification = async () => true
  const refreshUser = async () => user
  const getIdToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  }

  // ── Context value ──────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // User state
    user,
    supabaseUser,
    firebaseUser: null, // legacy compat
    isGuest,
    isAuthenticated,
    loading,

    // Auth modal controls
    authModalOpen,
    authModalMode,
    openSignIn,
    openSignUp,
    closeAuthModal,

    // Auth actions
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    continueAsGuest,

    // Onboarding
    hasSeenOnboarding,
    completeOnboarding,
    resetOnboarding,

    // Legacy compat
    isEmailVerified: Boolean(supabaseUser?.email_confirmed_at),
    isPasswordRecovery: false,
    setIsPasswordRecovery: () => {},
    requestPasswordReset,
    sendEmailVerification,
    refreshUser,
    getIdToken,
  }), [
    user, supabaseUser, isGuest, isAuthenticated, loading,
    authModalOpen, authModalMode,
    openSignIn, openSignUp, closeAuthModal,
    signIn, signUp, signOut, signInWithGoogle, continueAsGuest,
    hasSeenOnboarding, completeOnboarding, resetOnboarding,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
