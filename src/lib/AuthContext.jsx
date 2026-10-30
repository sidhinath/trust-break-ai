import React, { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

function getStoredGuestSession() {
  try {
    const rawSession = sessionStorage.getItem('ghostnet_guest_session') || localStorage.getItem('ghostnet_guest_session_active')
    return rawSession ? JSON.parse(rawSession) : null
  } catch {
    return null
  }
}

function buildUserFromEmail(email, displayName) {
  const cleanEmail = (email || 'guest@ghostnet.ai').trim()
  const baseName = displayName || cleanEmail.split('@')[0] || 'GhostNet User'
  const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return {
    uid: `ghostnet-${baseName.toLowerCase().replace(/\s+/g, '-')}-${idSuffix}`,
    id: `ghostnet-${baseName.toLowerCase().replace(/\s+/g, '-')}-${idSuffix}`,
    email: cleanEmail,
    displayName: baseName,
    emailVerified: true,
    photoURL: '',
    user_metadata: {
      full_name: baseName,
      avatar_url: '',
    },
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredGuestSession())
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    try {
      return localStorage.getItem('ghostnet_has_seen_onboarding') === 'true'
    } catch {
      return false
    }
  })

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery'))
      )
    } catch {
      return false
    }
  })

  const completeOnboarding = () => {
    setHasSeenOnboarding(true)
    try {
      localStorage.setItem('ghostnet_has_seen_onboarding', 'true')
    } catch {}
  }

  const resetOnboarding = () => {
    setHasSeenOnboarding(false)
    try {
      localStorage.removeItem('ghostnet_has_seen_onboarding')
    } catch {}
  }

  const persistGuestSession = (nextUser) => {
    setUser(nextUser)
    try {
      sessionStorage.setItem('ghostnet_guest_session', JSON.stringify(nextUser))
      localStorage.setItem('ghostnet_guest_session_active', JSON.stringify(nextUser))
    } catch {}
  }

  const continueAsGuest = () => {
    const demoUser = buildUserFromEmail('operator@ghostnet.ai', 'GhostNet Defense Operator')
    persistGuestSession(demoUser)
  }

  const signUp = async (email, password, name) => {
    const userObj = buildUserFromEmail(email, name || email.split('@')[0])
    persistGuestSession(userObj)
    return userObj
  }

  const signIn = async (email, password) => {
    const userObj = buildUserFromEmail(email, email.split('@')[0])
    persistGuestSession(userObj)
    return userObj
  }

  const signInWithGoogle = async () => {
    const userObj = buildUserFromEmail('analyst@ghostnet.ai', 'GhostNet User')
    persistGuestSession(userObj)
    return userObj
  }

  const requestPasswordReset = async () => true
  const sendEmailVerification = async () => true
  const refreshUser = async () => user

  const signOut = async () => {
    try {
      sessionStorage.removeItem('ghostnet_guest_session')
      localStorage.removeItem('ghostnet_guest_session_active')
      localStorage.removeItem('ghostnet_guest_session')
    } catch {}
    setUser(null)
    setFirebaseUser(null)
    setIsPasswordRecovery(false)
  }

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      isAuthenticated: Boolean(user),
      isEmailVerified: Boolean(firebaseUser?.emailVerified ?? user?.emailVerified),
      hasSeenOnboarding,
      completeOnboarding,
      resetOnboarding,
      continueAsGuest,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      isPasswordRecovery,
      setIsPasswordRecovery,
      requestPasswordReset,
      sendEmailVerification,
      refreshUser,
      getIdToken: async () => null,
    }),
    [user, firebaseUser, loading, hasSeenOnboarding, isPasswordRecovery]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
