import { lazy } from 'react'
import { reloadAppOnce } from '@/lib/pwaUpdate'

/**
 * Chunk-load recovery.
 *
 * After a new Vercel deployment the previous build's hashed chunks disappear.
 * A mobile client that still holds the old `index.html` (or is on a flaky
 * network) then fails with `ChunkLoadError` / "Failed to fetch dynamically
 * imported module". This helper retries the import once, then silently reloads
 * via the shared `last_auto_reload` guard in pwaUpdate.js, so a PWA update and
 * a stale chunk can never reload back-to-back.
 */

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

/**
 * Reload the page at most once per cooldown window.
 * Returns true when a reload was actually triggered.
 */
export function reloadForChunkError() {
  return reloadAppOnce({ reason: 'chunk-error' })
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

      // Reload already attempted recently — let the boundary keep a transient
      // loader visible instead of looping or showing a blocking update prompt.
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
