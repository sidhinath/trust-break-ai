import { useState, useEffect } from 'react'

let globalDeferredPrompt = null

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt)
  const [isInstallable, setIsInstallable] = useState(!!globalDeferredPrompt)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      setIsInstallable(false)
      return
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      globalDeferredPrompt = e
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      globalDeferredPrompt = null
      setDeferredPrompt(null)
      setIsInstallable(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Listen to display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayChange = (evt) => {
      if (evt.matches) {
        setIsInstalled(true)
        setIsInstallable(false)
      }
    }
    mediaQuery.addEventListener?.('change', handleDisplayChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener?.('change', handleDisplayChange)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) {
      // If native prompt is not yet ready or iOS Safari, return manual guidance
      return { outcome: 'dismissed', manual: true }
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        globalDeferredPrompt = null
        setDeferredPrompt(null)
        setIsInstallable(false)
      }
      return { outcome, manual: false }
    } catch (err) {
      console.warn('[PWA] Prompt error:', err)
      return { outcome: 'error', manual: false }
    }
  }

  return { isInstallable, isInstalled, promptInstall }
}
