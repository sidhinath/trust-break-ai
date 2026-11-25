import { scoreToRisk } from './scanner.js'
import { filterValidReasonCodes } from './reasonCodes.js'
import { parseJsonFromText, extractGeminiText } from './vision.js'

/**
 * Centralized AI Model Router (`aiRouter`)
 *
 * Single source of truth for:
 * - Text-based scan fallback chain (Message, Link/URL, QR decoded text, Senior Mode, Extension)
 * - Multimodal/Media scan fallback chain (Screenshot Vision OCR, Photo upload, Voice/Audio)
 * - 24-hour result deduplication cache
 * - Automatic 1.5s retry on HTTP 429 / 503
 * - Normalized JSON verdict schema (`score`, `verdict`, `summary`, `indicators` + legacy aliases)
 */

export const TEXT_MODEL_CHAIN = [
  { provider: 'groq', model: 'openai/gpt-oss-20b' },
  { provider: 'groq', model: 'llama-3.1-8b-instant' },
  { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
]

export const MULTIMODAL_MODEL_CHAIN = [
  { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
  { provider: 'gemini', model: 'gemini-3.8-flash' },
]

export const AI_ROUTER_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_ROUTER_CACHE_ENTRIES = 2000
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

const routerCache = new Map()

/**
 * Normalizes raw input so semantically identical URLs/messages share one cache entry.
 */
export function normalizeRouterInput(kind, rawInput = '') {
  const trimmed = String(rawInput || '').trim()
  if (kind === 'link') {
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
 * Isomorphic (browser + Node) deterministic hash for cache keys.
 */
export function buildRouterCacheKey(kind, rawInput = '') {
  const normalized = `${kind}:${normalizeRouterInput(kind, rawInput)}`
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized.charCodeAt(i)
    h1 ^= ch
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= ch + i
    h2 = Math.imul(h2, 0x85ebca6b)
  }
  return `${kind}_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}_${normalized.length}`
}

export function getRouterCache(key) {
  if (!key) return null
  const entry = routerCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    routerCache.delete(key)
    return null
  }
  return { ...entry.data, cached: true }
}

export function setRouterCache(key, data, ttlMs = AI_ROUTER_CACHE_TTL_MS) {
  if (!key || !data || data.degraded || data.unverified) return
  if (routerCache.size >= MAX_ROUTER_CACHE_ENTRIES) {
    const oldest = routerCache.keys().next().value
    if (oldest) routerCache.delete(oldest)
  }
  routerCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

/**
 * Retries a fetch call once after 1.5s when upstream returns 429 (Rate Limit) or 503 (Busy).
 */
export async function routerFetchWithRetry(
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

/**
 * Normalizes any Groq or Gemini raw JSON output into one consistent schema:
 * `{ score, verdict, summary, indicators }` plus existing UI compatibility fields.
 */
export function normalizeRouterVerdict(parsed, { provider, model, extra = {} } = {}) {
  if (!parsed || typeof parsed !== 'object') return null
  const rawScore = parsed.score ?? parsed.fraud_score
  if (typeof rawScore === 'undefined') return null

  const score = Math.max(0, Math.min(100, Number(rawScore || 0)))
  const rawVerdict = parsed.verdict ?? parsed.risk_level
  const verdict = ['safe', 'suspicious', 'scam'].includes(rawVerdict)
    ? rawVerdict
    : scoreToRisk(score)

  const rawIndicators = Array.isArray(parsed.indicators)
    ? parsed.indicators
    : Array.isArray(parsed.reasons)
    ? parsed.reasons
    : []
  const indicators = rawIndicators.map((item) => String(item))

  const summary = String(
    parsed.summary || parsed.analysis || parsed.ai_analysis || ''
  )

  return {
    // Unified central router schema
    score,
    verdict,
    summary,
    indicators,
    // Backward-compatible fields for all existing scanner UIs
    fraud_score: score,
    risk_level: verdict,
    analysis: summary,
    ai_analysis: summary,
    reasons: indicators,
    confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
    attack_intent: parsed.attack_intent ? String(parsed.attack_intent) : '',
    reasonCodes: filterValidReasonCodes(parsed.reasonCodes || parsed.reason_codes || []),
    source: provider,
    model,
    ...extra,
  }
}

/**
 * Routes all text-based scans through TEXT_MODEL_CHAIN:
 * 1. openai/gpt-oss-20b (Groq)
 * 2. llama-3.1-8b-instant (Groq)
 * 3. gemini-3.5-flash-lite (Gemini)
 */
export async function runTextAnalysisWithRouter({
  prompt,
  groqKey,
  geminiKey,
  cacheKey = null,
  diagnostics = null,
  systemPrompt = 'You are TrustBreak AI. Always respond in strict, valid JSON format only.',
}) {
  if (cacheKey) {
    const cached = getRouterCache(cacheKey)
    if (cached) return cached
  }

  for (const step of TEXT_MODEL_CHAIN) {
    const startedAt = Date.now()
    if (step.provider === 'groq') {
      if (!groqKey) continue
      try {
        const response = await routerFetchWithRetry(GROQ_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: step.model,
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          }),
        })

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          diagnostics?.attempts?.push({
            model: step.model,
            provider: 'groq',
            ok: false,
            status: response.status,
            durationMs: Date.now() - startedAt,
            error: errText.slice(0, 200),
          })
          continue
        }

        const data = await response.json()
        const text = data?.choices?.[0]?.message?.content
        const parsed = parseJsonFromText(text)
        const normalized = normalizeRouterVerdict(parsed, {
          provider: 'groq',
          model: step.model,
        })
        if (normalized) {
          diagnostics?.attempts?.push({
            model: step.model,
            provider: 'groq',
            ok: true,
            status: response.status,
            durationMs: Date.now() - startedAt,
          })
          if (cacheKey) setRouterCache(cacheKey, normalized)
          return normalized
        }
      } catch (err) {
        diagnostics?.attempts?.push({
          model: step.model,
          provider: 'groq',
          ok: false,
          durationMs: Date.now() - startedAt,
          error: err?.message,
        })
      }
    } else if (step.provider === 'gemini') {
      if (!geminiKey) continue
      try {
        const response = await routerFetchWithRetry(
          `${GEMINI_ENDPOINT}/${step.model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              },
            }),
          }
        )

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          diagnostics?.attempts?.push({
            model: step.model,
            provider: 'gemini',
            ok: false,
            status: response.status,
            durationMs: Date.now() - startedAt,
            error: errText.slice(0, 200),
          })
          continue
        }

        const data = await response.json()
        const text = extractGeminiText(data)
        const parsed = parseJsonFromText(text)
        const normalized = normalizeRouterVerdict(parsed, {
          provider: 'gemini',
          model: step.model,
        })
        if (normalized) {
          diagnostics?.attempts?.push({
            model: step.model,
            provider: 'gemini',
            ok: true,
            status: response.status,
            durationMs: Date.now() - startedAt,
          })
          if (cacheKey) setRouterCache(cacheKey, normalized)
          return normalized
        }
      } catch (err) {
        diagnostics?.attempts?.push({
          model: step.model,
          provider: 'gemini',
          ok: false,
          durationMs: Date.now() - startedAt,
          error: err?.message,
        })
      }
    }
  }

  return null
}

/**
 * Routes all multimodal/media scans through MULTIMODAL_MODEL_CHAIN:
 * 1. gemini-3.5-flash-lite (primary)
 * 2. gemini-3.8-flash (fallback)
 */
export async function runMultimodalAnalysisWithRouter({
  parts,
  geminiKey,
  cacheKey = null,
  diagnostics = null,
}) {
  if (!geminiKey) return null

  if (cacheKey) {
    const cached = getRouterCache(cacheKey)
    if (cached) return cached
  }

  for (const step of MULTIMODAL_MODEL_CHAIN) {
    const startedAt = Date.now()
    try {
      const response = await routerFetchWithRetry(
        `${GEMINI_ENDPOINT}/${step.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.15,
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        diagnostics?.attempts?.push({
          model: step.model,
          provider: 'gemini',
          ok: false,
          status: response.status,
          durationMs: Date.now() - startedAt,
          error: errText.slice(0, 200),
        })
        continue
      }

      const data = await response.json()
      const text = extractGeminiText(data)
      const parsed = parseJsonFromText(text)
      const normalized = normalizeRouterVerdict(parsed, {
        provider: 'gemini',
        model: step.model,
        extra: {
          transcript: parsed?.transcript ? String(parsed.transcript) : undefined,
        },
      })
      if (normalized) {
        diagnostics?.attempts?.push({
          model: step.model,
          provider: 'gemini',
          ok: true,
          status: response.status,
          durationMs: Date.now() - startedAt,
        })
        if (cacheKey) setRouterCache(cacheKey, normalized)
        return normalized
      }
    } catch (err) {
      diagnostics?.attempts?.push({
        model: step.model,
        provider: 'gemini',
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err?.message,
      })
    }
  }

  return null
}
