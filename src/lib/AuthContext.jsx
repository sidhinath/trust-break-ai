import React, { createContext, useContext, useMemo, useState } from 'react'
import {
  buildUserFromEmail,
  signInLocalUser,
  signUpLocalUser,
  validateCredentials,
} from '@/lib/authUtils'

const AuthContext = createContext(null)

function getStoredGuestSession() {
  try {
    const rawSession = sessionStorage.getItem('trustbreak_guest_session') || localStorage.getItem('trustbreak_guest_session_active')
    return rawSession ? JSON.parse(rawSession) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredGuestSession())
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    try {
      return localStorage.getItem('trustbreak_has_seen_onboarding') === 'true'
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
      localStorage.setItem('trustbreak_has_seen_onboarding', 'true')
    } catch {}
  }

  const resetOnboarding = () => {
    setHasSeenOnboarding(false)
    try {
      localStorage.removeItem('trustbreak_has_seen_onboarding')
    } catch {}
  }

  const persistGuestSession = (nextUser) => {
    setUser(nextUser)
    try {
      sessionStorage.setItem('trustbreak_guest_session', JSON.stringify(nextUser))
      localStorage.setItem('trustbreak_guest_session_active', JSON.stringify(nextUser))
    } catch {}
  }

  const continueAsGuest = () => {
    const demoUser = buildUserFromEmail('operator@trustbreak.ai', 'TrustBreak AI Defense Operator')
    persistGuestSession(demoUser)
    return demoUser
  }

  const signUp = async (email, password, name) => {
    const { user: userObj } = signUpLocalUser(email, password, name)
    persistGuestSession(userObj)
    return userObj
  }

  const signIn = async (email, password) => {
    const { user: userObj } = signInLocalUser(email, password)
    persistGuestSession(userObj)
    return userObj
  }

  const signInWithGoogle = async () => {
    const userObj = buildUserFromEmail('analyst@trustbreak.ai', 'TrustBreak User')
    persistGuestSession(userObj)
    return userObj
  }

  const requestPasswordReset = async () => true
  const sendEmailVerification = async () => true
  const refreshUser = async () => user

  const signOut = async () => {
    try {
      sessionStorage.removeItem('trustbreak_guest_session')
      localStorage.removeItem('trustbreak_guest_session_active')
      localStorage.removeItem('trustbreak_guest_session')
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
