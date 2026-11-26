import { test } from 'node:test'
import assert from 'node:assert/strict'

// Minimal synchronous storage so the browser cache path can be exercised in Node.
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
}

test('aiRouter persists verdicts to localStorage for instant repeat scans', async () => {
  const router = await import('../src/lib/aiRouter.js')
  assert.equal(router.AI_ROUTER_CACHE_TTL_MS, 24 * 60 * 60 * 1000)

  const message = 'URGENT: verify your OTP now'
  const key = router.buildRouterCacheKey('message', message)
  router.setRouterCache(key, { fraud_score: 88, risk_level: 'scam' })

  const persisted = JSON.parse(store.get(router.AI_ROUTER_STORAGE_KEY))
  assert.ok(persisted[key], 'verdict must be persisted, not only held in memory')

  // A distinct module URL gives a fresh in-memory Map, like a PWA relaunch.
  const fresh = await import('../src/lib/aiRouter.js?fresh=persistence-check')
  const cached = fresh.getRouterCache(key)
  assert.equal(cached.fraud_score, 88)
  assert.equal(cached.cached, true)
})

test('aiRouter expires cached verdicts after the TTL', async () => {
  const router = await import('../src/lib/aiRouter.js?fresh=ttl-check')
  const key = router.buildRouterCacheKey('link', 'https://example.com/verify')
  router.setRouterCache(key, { fraud_score: 10, risk_level: 'safe' }, -1)
  assert.equal(router.getRouterCache(key), null)
})

test('aiRouter does not cache degraded or unverified verdicts', async () => {
  const router = await import('../src/lib/aiRouter.js?fresh=degraded-check')
  const key = router.buildRouterCacheKey('message', 'no image payload')
  router.setRouterCache(key, { fraud_score: 65, risk_level: 'safe', degraded: true })
  assert.equal(router.getRouterCache(key), null)
})
