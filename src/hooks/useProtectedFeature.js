import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'

/**
 * useProtectedFeature
 *
 * Hook that returns helpers for gating any action/feature behind authentication.
 *
 * Usage:
 *   const { isAllowed, requireAuth } = useProtectedFeature()
 *
 *   // In a click handler:
 *   const handleScan = requireAuth(() => { ... do the protected thing ... })
 *
 *   // Or inline:
 *   if (!isAllowed) { ... show fallback ... }
 *
 * Also returns `loginModalProps` — spread onto <LoginRequiredModal> to control it:
 *   <LoginRequiredModal {...loginModalProps} />
 */
export function useProtectedFeature(featureName) {
  const { isAuthenticated } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const isAllowed = isAuthenticated

  /**
   * Wraps a callback. If the user isn't authenticated the callback is blocked
   * and the login modal is shown instead.
   */
  const requireAuth = useCallback((fn) => {
    return (...args) => {
      if (isAuthenticated) {
        return fn?.(...args)
      }
      setShowLoginModal(true)
    }
  }, [isAuthenticated])

  /**
   * Imperatively check and open modal.
   * Returns true if allowed, false (and opens modal) if not.
   */
  const checkAuth = useCallback(() => {
    if (isAuthenticated) return true
    setShowLoginModal(true)
    return false
  }, [isAuthenticated])

  const loginModalProps = {
    isOpen: showLoginModal,
    onClose: () => setShowLoginModal(false),
    feature: featureName,
  }

  return {
    isAllowed,
    requireAuth,
    checkAuth,
    showLoginModal,
    setShowLoginModal,
    loginModalProps,
  }
}
