import crypto from 'node:crypto'

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_ENTRIES = 2000

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_MAX_REQUESTS = 10

const scanCache = new Map()
const rateLimitStore = new Map()

/**
 * Normalizes a URL or message string so semantically identical inputs share one cache key.
 */
export function normalizeCacheInput(type, rawInput = '') {
  const trimmed = String(rawInput || '').trim()
  if (type === 'link') {
    try {
      const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      const parsed = new URL(candidate)
      parsed.hash = ''
      return parsed.href.replace(/\/+$/, '').toLowerCase()
    } catch {
      return trimmed.toLowerCase()
    }
  }
  return trimmed.toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Builds a SHA-256 cache key for a scan type and normalized input.
 */
export function buildScanCacheKey(type, rawInput = '') {
  const normalized = normalizeCacheInput(type, rawInput)
  return crypto.createHash('sha256').update(`${type}:${normalized}`).digest('hex')
}

/**
 * Returns a cached scan result if present and within the 24-hour TTL.
 */
export function getCachedScanResult(key) {
  if (!key) return null
  const entry = scanCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    scanCache.delete(key)
    return null
  }
  return {
    ...entry.data,
    cached: true,
  }
}

/**
 * Stores a verified scan result in memory for 24 hours with bounded eviction.
 */
export function setCachedScanResult(key, data, ttlMs = CACHE_TTL_MS) {
  if (!key || !data || data.degraded || data.unverified) return
  if (scanCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = scanCache.keys().next().value
    if (oldestKey) scanCache.delete(oldestKey)
  }
  scanCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

/**
 * Extracts a stable per-user or per-IP identifier from the request.
 */
export function getClientIdentifier(req) {
  const userHeader = req?.headers?.['x-user-id']
  if (typeof userHeader === 'string' && userHeader.trim()) {
    return `user:${userHeader.trim()}`
  }

  const forwarded = req?.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return `ip:${forwarded.split(',')[0].trim()}`
  }

  const realIp = req?.headers?.['x-real-ip']
  if (typeof realIp === 'string' && realIp.trim()) {
    return `ip:${realIp.trim()}`
  }

  const remote = req?.socket?.remoteAddress
  return `ip:${remote || 'anonymous'}`
}

/**
 * Enforces a lightweight per-IP / per-user rate limit (default: 10 requests/minute).
 * Returns true if the request may proceed, or writes HTTP 429 and returns false.
 */
export function enforceRateLimit(
  req,
  res,
  {
    scope = 'default',
    windowMs = RATE_LIMIT_WINDOW_MS,
    max = DEFAULT_MAX_REQUESTS,
  } = {}
) {
  const now = Date.now()
  const key = `${scope}:${getClientIdentifier(req)}`

  // Periodic lightweight cleanup to keep map bounded
  if (rateLimitStore.size > 5000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetAt) rateLimitStore.delete(k)
    }
  }

  let record = rateLimitStore.get(key)
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + windowMs }
  }

  record.count += 1
  rateLimitStore.set(key, record)

  const remaining = Math.max(0, max - record.count)
  const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000))

  if (typeof res?.setHeader === 'function') {
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(remaining))
  }

  if (record.count > max) {
    if (typeof res?.setHeader === 'function') {
      res.setHeader('Retry-After', String(retryAfterSec))
    }
    res.status(429).json({
      error: "You're scanning too fast—please wait a few seconds and try again.",
      retryAfter: retryAfterSec,
    })
    return false
  }

  return true
}

/**
 * Retries a fetch call once after `delayMs` (default 1500ms) when the upstream
 * provider responds with 429 (Rate Limit) or 503 (Busy).
 */
export async function fetchWithRetry(
  url,
  options,
  { retryStatuses = [429, 503], delayMs = 1500 } = {}
) {
  let response = await fetch(url, options)
  if (retryStatuses.includes(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    response = await fetch(url, options)
  }
  return response
}
