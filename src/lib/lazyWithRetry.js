import { lazy } from 'react'

/**
 * Chunk-load recovery.
 *
 * After a new Vercel deployment the previous build's hashed chunks disappear.
 * A mobile client that still holds the old `index.html` (or is on a flaky
 * network) then fails with `ChunkLoadError` / "Failed to fetch dynamically
 * imported module". This helper retries the import once, then performs a
 * single guarded hard reload so the browser fetches the new build manifest.
 *
 * The guard is a timestamp in sessionStorage: a reload is only allowed once
 * per cooldown window, so a persistent failure can never create a reload loop.
 */

const RELOAD_AT_KEY = 'tb:chunk-reload-at'
const RELOAD_COOLDOWN_MS = 10_000
const DEFAULT_RETRY_DELAY_MS = 350

const CHUNK_ERROR_PATTERNS = [
  'chunkloaderror',
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'loading chunk',
  'loading css chunk',
]

/** True when an error is a missing/stale build chunk rather than an app bug. */
export function isChunkLoadError(error) {
  if (!error) return false

  const name = typeof error?.name === 'string' ? error.name : ''
  const message = typeof error?.message === 'string' ? error.message : String(error)

  if (name === 'ChunkLoadError') return true

  const haystack = `${name} ${message}`.toLowerCase()
  return CHUNK_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern))
}

function readLastReloadAt() {
  try {
    const raw = window.sessionStorage.getItem(RELOAD_AT_KEY)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

function writeLastReloadAt(timestamp) {
  try {
    window.sessionStorage.setItem(RELOAD_AT_KEY, String(timestamp))
  } catch {
    /* sessionStorage unavailable (private mode / embedded webview) */
  }
}

/**
 * Reload the page at most once per cooldown window.
 * Returns true when a reload was actually triggered.
 */
export function reloadForChunkError({ force = false } = {}) {
  if (typeof window === 'undefined') return false

  const now = Date.now()
  if (!force && now - readLastReloadAt() < RELOAD_COOLDOWN_MS) return false

  writeLastReloadAt(now)
  window.location.reload()
  return true
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function importWithRetry(importer, retries, retryDelay) {
  let attempt = 0

  for (;;) {
    try {
      return await importer()
    } catch (error) {
      if (!isChunkLoadError(error)) throw error

      if (attempt < retries) {
        attempt += 1
        await wait(retryDelay * attempt)
        continue
      }

      if (reloadForChunkError()) {
        // Keep Suspense pending while the browser navigates away, so the
        // error boundary never flashes before the reload lands.
        return new Promise(() => {})
      }

      // Reload already attempted recently — surface the error instead of
      // looping, letting AppErrorBoundary show the manual refresh UI.
      throw error
    }
  }
}

/**
 * Drop-in replacement for React.lazy that survives stale-deployment chunk
 * failures on mobile and slow networks.
 */
export function lazyWithRetry(importer, { retries = 1, retryDelay = DEFAULT_RETRY_DELAY_MS } = {}) {
  return lazy(() => importWithRetry(importer, retries, retryDelay))
}
