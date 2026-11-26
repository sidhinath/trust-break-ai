/**
 * Silent PWA auto-update controller.
 *
 * The service worker installs with skipWaiting() and claims clients on
 * activate. When the active worker changes, this module reloads the page once
 * (guarded by sessionStorage) so users never see an update prompt.
 *
 * The same guarded helper is used by lazy chunk recovery, so a stale hashed
 * asset and a PWA update can never cause back-to-back reloads.
 */

const AUTO_RELOAD_KEY = 'last_auto_reload'
const AUTO_RELOAD_GUARD_MS = 10_000

let registration = null
let controllerListenerAttached = false

function readTimestamp() {
  if (typeof window === 'undefined') return 0
  try {
    const parsed = Number(window.sessionStorage.getItem(AUTO_RELOAD_KEY))
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

function writeTimestamp(value) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(AUTO_RELOAD_KEY, String(value))
  } catch {
    /* private mode / embedded webview — reload still proceeds */
  }
}

/**
 * Reload at most once per 10-second window. Shared by service-worker updates
 * and chunk-load recovery to prevent infinite reload loops.
 */
export function reloadAppOnce({ reason = 'auto-update', force = false } = {}) {
  if (typeof window === 'undefined') return false

  const now = Date.now()
  const last = readTimestamp()

  // `force` is only used for explicit user actions; automatic paths never use
  // it, so an update/chunk failure cannot create a reload loop.
  if (!force && last > 0 && now - last < AUTO_RELOAD_GUARD_MS) {
    return false
  }

  writeTimestamp(now)
  console.info(`[TrustBreak PWA] Reloading once (${reason})`)
  window.location.reload()
  return true
}

function ensureControllerListener() {
  if (controllerListenerAttached) return

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    reloadAppOnce({ reason: 'service-worker-update' })
  })

  controllerListenerAttached = true
}

function isSupported() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false
  if (typeof window === 'undefined') return false
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  return window.location.protocol === 'https:' || isLocalhost
}

export async function registerPwa() {
  if (!isSupported()) return null

  try {
    // Attach before registration: the new worker may claim this page as soon
    // as it installs, and that controllerchange must trigger the one reload.
    ensureControllerListener()

    const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    registration = reg
    await checkForPwaUpdates()
    return reg
  } catch (error) {
    console.warn('[TrustBreak PWA] Registration failed:', error)
    return null
  }
}

/** Ask the browser to revalidate /sw.js. Safe to call on every resume. */
export async function checkForPwaUpdates() {
  if (!isSupported()) return

  try {
    const reg = registration || (await navigator.serviceWorker.getRegistration('/'))
    if (!reg) return

    registration = reg
    await reg.update()
  } catch (error) {
    console.warn('[TrustBreak PWA] Update check failed:', error)
  }
}
