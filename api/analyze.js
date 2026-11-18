import {
  analyzeMessageContent,
  analyzeUrlContent,
  analyzeScamReportContent,
  analyzeScreenshotFallback,
  extractAttackSignals,
  reconstructAttackChain,
  inferAttackerIntent,
  findSimilarScams,
  scoreToRisk,
  normalize,
  inferReasonCodes,
} from '../src/lib/scanner.js'
import { filterValidReasonCodes } from '../src/lib/reasonCodes.js'
import {
  GEMINI_KEY_ENV_NAMES,
  VISION_MODELS,
  VISION_PROMPT,
  buildVisionRequestBody,
  describeGeminiFailure,
  extractGeminiText,
  keyFingerprint,
  normalizeImageBase64,
  normalizeVisionResult,
  parseJsonFromText,
  resolveGeminiKey,
} from '../src/lib/vision.js'
import crypto from 'node:crypto'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Defensively parses the AI response and extracts reasonCodes / explanation.
 * Returns { reasonCodes, explanation } or null on failure.
 * Unknown codes are silently filtered via filterValidReasonCodes().
 */
function safeParseVerdict(text) {
  try {
    const parsed = parseJsonFromText(text)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      reasonCodes: filterValidReasonCodes(parsed.reasonCodes || parsed.reason_codes || []),
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : null,
    }
  } catch {
    return null
  }
}

/**
 * Wraps a promise with a hard timeout.
 * @param {Promise} promise
 * @param {number} ms - timeout in milliseconds
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI call timed out after ${ms}ms`)), ms)
    ),
  ])
}

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '9000', 10)
// Total budget for the whole vision chain. Stays under the 60s function limit.
const VISION_TIMEOUT_MS = parseInt(process.env.VISION_TIMEOUT_MS || '45000', 10)
// Budget for a single model call. A model that hangs must not block the scan.
const VISION_MODEL_TIMEOUT_MS = parseInt(process.env.VISION_MODEL_TIMEOUT_MS || '20000', 10)
// If the preferred model has not answered by now, start the next one in
// parallel (hedged request) so a slow/overloaded model costs seconds, not the
// whole budget.
const VISION_HEDGE_DELAY_MS = parseInt(process.env.VISION_HEDGE_DELAY_MS || '6000', 10)

// ---------------------------------------------------------------------------
// Supabase server-side client (for blocklist + community feed lookups)
// ---------------------------------------------------------------------------

function getSupabaseReadClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  // Read operations can use service role key or fall back to public anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return {
    from: (table) => ({
      select: (cols) => ({
        eq: (col, val) => ({
          single: () => supabaseFetch('GET', url, key, table, { select: cols, eq: `${col}.eq.${val}`, limit: 1 }),
          limit: (n) => supabaseFetch('GET', url, key, table, { select: cols, eq: `${col}.eq.${val}`, limit: n }),
        }),
        limit: (n) => supabaseFetch('GET', url, key, table, { select: cols, limit: n }),
      }),
    }),
  }
}

function getSupabaseServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // Lightweight fetch-based Supabase REST client (no npm dependency needed)
  return {
    from: (table) => ({
      select: (cols) => ({
        eq: (col, val) => ({
          single: () => supabaseFetch('GET', url, key, table, { select: cols, eq: `${col}.eq.${val}`, limit: 1 }),
          limit: (n) => supabaseFetch('GET', url, key, table, { select: cols, eq: `${col}.eq.${val}`, limit: n }),
        }),
        limit: (n) => supabaseFetch('GET', url, key, table, { select: cols, limit: n }),
      }),
      upsert: (row, opts) => supabaseFetchUpsert(url, key, table, row, opts),
    }),
  }
}

async function supabaseFetch(method, url, key, table, params = {}) {
  try {
    const qs = new URLSearchParams()
    if (params.select) qs.set('select', params.select)
    if (params.eq) qs.set(params.eq.split('.eq.')[0], `eq.${params.eq.split('.eq.')[1]}`)
    if (params.limit) qs.set('limit', String(params.limit))
    const resp = await fetch(`${url}/rest/v1/${table}?${qs.toString()}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    })
    if (!resp.ok) return { data: null, error: new Error(await resp.text()) }
    const data = await resp.json()
    return { data: Array.isArray(data) ? data : [data], error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

async function supabaseFetchUpsert(url, key, table, row, opts = {}) {
  try {
    const qs = new URLSearchParams()
    if (opts.onConflict) qs.set('on_conflict', opts.onConflict)
    const queryString = qs.toString() ? `?${qs.toString()}` : ''
    const resp = await fetch(`${url}/rest/v1/${table}${queryString}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: `resolution=${opts.onConflict ? 'merge-duplicates' : 'ignore-duplicates'},return=minimal`,
      },
      body: JSON.stringify(row),
    })
    return { error: resp.ok ? null : new Error(await resp.text()) }
  } catch (err) {
    return { error: err }
  }
}

function hashDomain(domain) {
  return crypto.createHash('sha256').update(domain.toLowerCase().trim()).digest('hex')
}

function extractDomain(rawUrl) {
  try {
    return new URL(rawUrl).hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Check community threat feed (threat_indicators table) for a given indicator hash.
 * Returns instant verdict object if found with risk_score >= 60, else null.
 */
async function checkCommunityFeed(indicatorHash) {
  const db = getSupabaseReadClient()
  if (!db) return null
  try {
    const { data } = await withTimeout(
      db.from('threat_indicators').select('risk_score,reason_codes,indicator_type').eq('indicator_hash', indicatorHash).limit(1),
      2000
    )
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null
    if (!row || row.risk_score < 60) return null
    const riskScore = Math.min(100, row.risk_score)
    return {
      fraud_score: riskScore,
      risk_level: scoreToRisk(riskScore),
      confidence: 'high',
      reasons: ['Previously identified high-risk indicator matched in community threat database'],
      analysis: 'This indicator was flagged as high-risk by multiple prior TrustBreak AI scans and recorded in the community threat intelligence feed.',
      ai_analysis: 'Community threat feed match.',
      reasonCodes: filterValidReasonCodes(row.reason_codes || []),
      explanation: 'Matched community threat intelligence feed.',
      source: 'community-threat-feed',
      engine: 'community-threat-feed',
      degraded: false,
      attack_intent: 'Previously identified malicious indicator — see original scan for full reconstruction.',
      threat_reconstruction: [],
      emergency_actions: {
        stop: 'Do NOT interact with this content.',
        verify: 'This indicator was confirmed malicious by prior community scans.',
        report: 'Already recorded in the TrustBreak AI community threat database.',
        secure: 'If you have interacted with this, take immediate protective action.',
      },
    }
  } catch {
    return null
  }
}

/**
 * Check public blocklist for a given domain hash.
 * Returns instant verdict object if found, else null.
 */
async function checkPublicBlocklist(domainHash) {
  const db = getSupabaseReadClient()
  if (!db) return null
  try {
    const { data } = await withTimeout(
      db.from('public_blocklist').select('source').eq('domain_hash', domainHash).limit(1),
      2000
    )
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null
    if (!row) return null
    return {
      fraud_score: 95,
      risk_level: 'scam',
      verdict: 'dangerous',
      confidence: 'high',
      reasons: [`Domain found in public threat feed: ${row.source}`],
      analysis: 'This domain is listed in a public malicious domain blocklist (OpenPhish or URLhaus). Do not visit this site.',
      ai_analysis: 'Public blocklist match.',
      reasonCodes: ['KNOWN_MALICIOUS_DOMAIN'],
      explanation: `Domain is on the ${row.source} public malicious feed.`,
      source: `public-feed:${row.source}`,
      engine: 'public-blocklist',
      degraded: false,
      attack_intent: 'Redirect victims to a known malicious phishing or malware-serving domain.',
      domain_age_days: 1,
      ssl_status: 'Untrusted',
      community_reports: 50,
      is_known_brand_impersonation: false,
      trust_profile: { trust: 0, warnings: 1, critical: 3 },
      threat_reconstruction: [],
      emergency_actions: {
        stop: 'Do NOT click or open this link.',
        verify: 'Check the official brand website directly.',
        report: 'Report this URL to your local cybercrime authority.',
        secure: 'If visited, run a malware scan immediately.',
      },
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Live OpenPhish fallback when the Supabase threat table is unreachable
// ---------------------------------------------------------------------------
let liveFeedCache = { fetchedAt: 0, domains: new Set() }
const LIVE_FEED_URL = 'https://openphish.com/feed.txt'
const LIVE_FEED_TTL_MS = 5 * 60 * 1000

async function checkLiveThreatFeed(hostname) {
  const now = Date.now()
  if (now - liveFeedCache.fetchedAt > LIVE_FEED_TTL_MS) {
    // Record the attempt up-front so a slow/unreachable feed cannot add
    // latency to every single analysis request.
    liveFeedCache = { ...liveFeedCache, fetchedAt: now }
    try {
      const resp = await withTimeout(fetch(LIVE_FEED_URL, { cache: 'no-store' }), 3000)
      if (resp.ok) {
        const text = await resp.text()
        const domains = new Set()
        for (const line of text.split('\n')) {
          const value = line.trim()
          if (!value || value.startsWith('#')) continue
          try {
            domains.add(new URL(value).hostname.toLowerCase())
          } catch {}
        }
        liveFeedCache = { fetchedAt: now, domains }
      }
    } catch (err) {
      console.warn('[TrustBreak AI] Live OpenPhish fallback unavailable:', err?.message)
    }
  }
  return liveFeedCache.domains.has(hostname)
}

function liveFeedVerdict(hostname) {
  return {
    fraud_score: 95,
    risk_level: 'scam',
    confidence: 'high',
    reasons: [`Domain ${hostname} is listed in the live OpenPhish phishing feed`],
    analysis: 'This domain is actively listed in the OpenPhish public phishing feed. Do not visit this site.',
    source: 'feed:openphish-live',
    engine: 'live-feed',
    degraded: false,
    attack_intent: 'Harvest credentials or deliver malware from a confirmed phishing domain.',
    threat_reconstruction: [],
  }
}

/**
 * Upsert a high-risk indicator into threat_indicators (fire-and-forget, never blocks response).
 * Requires privileged SUPABASE_SERVICE_ROLE_KEY to write.
 */
function recordThreatIndicator(indicatorHash, indicatorType, riskScore, reasonCodes) {
  if (riskScore < 60) return
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return
  const now = new Date().toISOString()
  supabaseFetchUpsert(
    url,
    serviceKey,
    'threat_indicators',
    {
      indicator_hash: indicatorHash,
      indicator_type: indicatorType,
      risk_score: riskScore,
      reason_codes: reasonCodes,
      report_count: 1,
      first_seen: now,
      last_seen: now,
    },
    { onConflict: 'indicator_hash' }
  ).catch(() => {}) // fire-and-forget
}

// ---------------------------------------------------------------------------
// Groq AI analysis
// ---------------------------------------------------------------------------

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
]

const REASON_CODES_INSTRUCTION = `
- reasonCodes (array of strings, choose ONLY from this exact list, pick all that apply):
  URGENCY_LANGUAGE, IMPERSONATES_BRAND, REQUESTS_OTP, LOOKALIKE_DOMAIN, PUNYCODE_DOMAIN,
  NEWLY_REGISTERED_DOMAIN, REQUESTS_PAYMENT, KNOWN_MALICIOUS_DOMAIN, SUSPICIOUS_ATTACHMENT_QR, GENERIC_GREETING
- explanation (concise 1-2 sentence plain-English summary of the top threat factor)`

const KEY_PLACEHOLDER_MARKERS = ['placeholder', 'your_groq', 'your-key', 'changeme', 'xxxx']

function inspectApiKey(value) {
  if (value === undefined || value === null || value === '') return { key: null, problem: 'is not set' }
  if (typeof value !== 'string') return { key: null, problem: 'is not a string' }
  const trimmed = value.trim()
  if (!trimmed) return { key: null, problem: 'is empty' }
  const lower = trimmed.toLowerCase()
  if (KEY_PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker))) {
    return { key: null, problem: 'is a placeholder value' }
  }
  if (trimmed.length < 20) return { key: null, problem: `looks truncated (${trimmed.length} chars)` }
  return { key: trimmed, problem: null }
}

/**
 * Resolves the Groq key and explains *why* it is missing when it cannot be
 * resolved. This is the root-cause fix for silent AI fallbacks.
 */
function resolveGroqKey(req = null) {
  const headerValue = req?.headers?.['x-groq-api-key']
  const fromHeader = inspectApiKey(headerValue)
  if (fromHeader.key) {
    return { key: fromHeader.key, source: 'x-groq-api-key header', reason: null }
  }

  const envValue = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  const fromEnv = inspectApiKey(envValue)
  if (fromEnv.key) {
    return { key: fromEnv.key, source: 'server env (GROQ_API_KEY)', reason: null }
  }

  const headerNote = typeof headerValue === 'string'
    ? `x-groq-api-key header ${fromHeader.problem}`
    : 'no x-groq-api-key header sent'
  const envNote = envValue !== undefined
    ? `GROQ_API_KEY ${fromEnv.problem}`
    : 'GROQ_API_KEY is not set on the server'

  return { key: null, source: 'none', reason: `${headerNote}; ${envNote}` }
}

function getValidGroqKey(req = null) {
  return resolveGroqKey(req).key
}

export function getGroqConfigurationStatus() {
  const envValue = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  const status = inspectApiKey(envValue)
  return {
    configured: Boolean(status.key),
    source: 'GROQ_API_KEY',
    problem: status.problem,
  }
}

export function getGeminiConfigurationStatus() {
  const resolved = resolveGeminiKey({ env: process.env })
  return {
    configured: Boolean(resolved.key),
    source: resolved.source,
    checked: resolved.checked,
    fingerprint: keyFingerprint(resolved.key),
    acceptedEnvVars: [...GEMINI_KEY_ENV_NAMES],
  }
}

// Exported for /api/vision-health so operators can verify the exact key and
// model chain without uploading an image.
export function getVisionRuntimeStatus() {
  const resolved = resolveGeminiKey({ env: process.env })
  return {
    configured: Boolean(resolved.key),
    keySource: resolved.source,
    fingerprint: keyFingerprint(resolved.key),
    checked: resolved.checked,
    acceptedEnvVars: [...GEMINI_KEY_ENV_NAMES],
    models: [...VISION_MODELS],
    timeoutMs: VISION_TIMEOUT_MS,
    modelTimeoutMs: VISION_MODEL_TIMEOUT_MS,
    hedgeDelayMs: VISION_HEDGE_DELAY_MS,
  }
}

async function analyzeWithGroq(type, payload, req = null, diag = null) {
  const keyInfo = resolveGroqKey(req)
  if (diag) {
    diag.keySource = keyInfo.source
    diag.keyReason = keyInfo.reason
    diag.attempts = diag.attempts || []
  }
  if (!keyInfo.key) {
    console.warn('[TrustBreak AI] AI analysis skipped —', keyInfo.reason)
    if (diag) diag.status = 'no-key'
    return null
  }

  let prompt = ''
  if (type === 'message') {
    prompt = `You are TrustBreak AI, an elite cybersecurity fraud and phishing detection engine.
Analyze this message for social engineering, phishing, urgency, financial fraud, impersonation, credential harvesting, or coercion.

Message:
"""${payload?.message || ''}"""

Return STRICT JSON only with keys:
- fraud_score (number 0-100)
- risk_level ("safe" | "suspicious" | "scam")
- confidence ("low" | "medium" | "high")
- reasons (array of specific evidence strings)
- analysis (clear, professional explanation of why this is or isn't a scam)
- attack_intent (plain-English summary of what the attacker is attempting to accomplish)
- signals (object with keys: urgency, financial, credential, impersonation, coercion - short string or null for each)
${REASON_CODES_INSTRUCTION}`
  } else if (type === 'link') {
    const pageTitle = String(payload?.title || payload?.page_title || '').slice(0, 300)
    const pageText = String(payload?.page_text || payload?.content || '').slice(0, 1500)
    prompt = `You are TrustBreak AI, an elite cybersecurity URL and domain inspection engine.
Analyze this URL for phishing, typosquatting, lookalike domains, credential harvesting, or deceptive redirects.

URL:
"""${payload?.url || ''}"""

Page title (from the live tab, may be empty):
"""${pageTitle}"""

Visible page text snippet (may be empty):
"""${pageText}"""

If this is a known phishing/security demonstration page (for example itisatrap.org or a Safe Browsing test page), state that explicitly and score it as HIGH RISK — never as safe.

Return STRICT JSON only with keys:
- fraud_score (number 0-100)
- risk_level ("safe" | "suspicious" | "scam")
- confidence ("low" | "medium" | "high")
- reasons (array of specific evidence strings)
- analysis (clear, professional explanation of the domain threat)
- attack_intent (plain-English summary of what the attacker wants)
- impersonated_brand (string of brand being mimicked, or null)
${REASON_CODES_INSTRUCTION}`
  } else if (type === 'report') {
    prompt = `Analyze this community scam report for threat validation:
Content: "${payload?.scam_content || ''}"
Type: "${payload?.report_type || ''}"
URL: "${payload?.url || ''}"
Phone: "${payload?.phone_number || ''}"

Return STRICT JSON only with keys:
- fraud_score (number 0-100)
- risk_level ("safe" | "suspicious" | "scam")
- ai_analysis (summary explanation of threat pattern)
${REASON_CODES_INSTRUCTION}`
  } else {
    return null
  }

  for (const model of GROQ_MODELS) {
    const startedAt = Date.now()
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${keyInfo.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are TrustBreak AI. Always respond in strict, valid JSON format only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        const detail = {
          model,
          status: response.status,
          ok: false,
          durationMs: Date.now() - startedAt,
          error: errorBody.slice(0, 300),
        }
        if (diag) diag.attempts.push(detail)
        console.warn(
          `[TrustBreak AI] Groq model ${model} failed: HTTP ${detail.status} in ${detail.durationMs}ms — ${detail.error || 'no body'}`
        )
        continue
      }
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      const parsed = parseJsonFromText(text)
      if (parsed && typeof parsed.fraud_score !== 'undefined') {
        const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
        const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score)
        const contentStr = type === 'message' ? payload.message : (payload.url || '')
        const verdict = safeParseVerdict(text)

        if (diag) {
          diag.status = 'ok'
          diag.attempts.push({ model, status: 200, ok: true, durationMs: Date.now() - startedAt })
        }

        return {
          fraud_score: score,
          risk_level: risk,
          confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((r) => String(r)) : [],
          analysis: String(parsed.analysis || parsed.ai_analysis || ''),
          ai_analysis: String(parsed.ai_analysis || parsed.analysis || ''),
          attack_intent: String(parsed.attack_intent || inferAttackerIntent(contentStr, '', risk)),
          signals: parsed.signals || extractAttackSignals(contentStr),
          threat_reconstruction: reconstructAttackChain(contentStr, type === 'link' ? payload.url : '', risk),
          similar_patterns: findSimilarScams(contentStr),
          reasonCodes: (verdict?.reasonCodes && verdict.reasonCodes.length > 0)
            ? verdict.reasonCodes
            : inferReasonCodes(contentStr, type === 'link' ? payload.url : '', parsed.signals || extractAttackSignals(contentStr), risk),
          explanation: verdict?.explanation || null,
          source: 'groq',
          engine: 'groq',
          degraded: false,
          emergency_actions: {
            stop: 'Do NOT click any links, enter PINs, or share verification codes.',
            verify: 'Call the organization using their known official hotline.',
            report: 'Record this threat in the TrustBreak AI community database.',
            secure: 'Freeze affected cards or rotate credentials immediately if compromised.'
          }
        }
      }
      if (diag) {
        diag.attempts.push({
          model,
          status: 200,
          ok: false,
          durationMs: Date.now() - startedAt,
          error: 'model returned no parseable JSON verdict',
        })
      }
      console.warn(`[TrustBreak AI] Groq model ${model} returned an unparseable verdict`)
    } catch (err) {
      if (diag) {
        diag.attempts.push({
          model,
          ok: false,
          durationMs: Date.now() - startedAt,
          error: err?.message || 'request failed',
        })
      }
      console.warn(`[TrustBreak AI] Groq model ${model} request failed: ${err?.message || err}`)
      continue
    }
  }

  if (diag) diag.status = 'all-models-failed'
  return null
}

// ---------------------------------------------------------------------------
// Gemini + OpenAI vision analysis
// ---------------------------------------------------------------------------

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Runs one model attempt against the Gemini API and records exactly what
 * happened. No silent catches: every branch writes to `diag.attempts`.
 *
 * Recovery built in:
 *  - 429/503 (transient overload) → one retry after a short pause
 *  - 400 about `thinkingConfig` → retry once without it
 *  - 404 "use models/X" (model retired) → records `suggestedModel` so the
 *    caller can try Google's replacement immediately
 */
async function callGeminiVision({ apiKey, model, base64, mimeType, diag }) {
  const startedAt = Date.now()
  const attempt = { model, ok: false, status: null, durationMs: 0 }

  const send = (payload) =>
    withTimeout(
      fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Header auth keeps the key out of URLs/logs.
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      }),
      VISION_MODEL_TIMEOUT_MS
    )

  try {
    let body = buildVisionRequestBody(base64, mimeType, model)
    let response = await send(body)
    let raw = await response.text()

    if (response.status === 400 && /thinking|Unknown name/i.test(raw) && body.generationConfig.thinkingConfig) {
      attempt.thinkingConfigDropped = true
      body = buildVisionRequestBody(base64, mimeType, model, { thinking: false })
      response = await send(body)
      raw = await response.text()
    }

    if (response.status === 429 || response.status === 503) {
      attempt.transientRetry = true
      await new Promise((resolve) => setTimeout(resolve, 600))
      response = await send(body)
      raw = await response.text()
    }

    attempt.status = response.status

    if (!response.ok) {
      attempt.error = raw.slice(0, 400)
      attempt.durationMs = Date.now() - startedAt

      // Google embeds its replacement model in retirement errors:
      // "This model models/gemini-3.8-flash is no longer available. Please
      // update your code to use models/gemini-4.0-flash". The message also
      // repeats the retired name, so pick the first model that is not the one
      // we just tried.
      const mentioned = [...raw.matchAll(/models\/([a-zA-Z0-9._-]{3,})/g)].map((m) => m[1])
      const suggested = mentioned.find((name) => name !== model)
      if (suggested && response.status === 404) {
        attempt.suggestedModel = suggested
      }

      diag.attempts.push(attempt)
      console.warn(`[TrustBreak AI][vision] ${model} failed HTTP ${response.status} in ${attempt.durationMs}ms — ${attempt.error}`)
      return null
    }

    let data = null
    try {
      data = JSON.parse(raw)
    } catch {
      attempt.error = `response was not JSON: ${raw.slice(0, 200)}`
      attempt.durationMs = Date.now() - startedAt
      diag.attempts.push(attempt)
      console.warn(`[TrustBreak AI][vision] ${model} returned unreadable body`)
      return null
    }

    const text = extractGeminiText(data)
    const parsed = parseJsonFromText(text)
    const result = normalizeVisionResult(parsed)

    attempt.durationMs = Date.now() - startedAt
    attempt.finishReason = data?.candidates?.[0]?.finishReason || null
    attempt.hasText = Boolean(text)

    if (!result) {
      attempt.error = describeGeminiFailure(data)
      diag.attempts.push(attempt)
      console.warn(`[TrustBreak AI][vision] ${model} responded but gave no verdict — ${attempt.error}`)
      return null
    }

    attempt.ok = true
    attempt.score = result.fraud_score
    attempt.risk = result.risk_level
    diag.attempts.push(attempt)
    diag.status = 'ok'
    diag.model = model
    console.log(`[TrustBreak AI][vision] ${model} verdict score=${result.fraud_score} risk=${result.risk_level} in ${attempt.durationMs}ms`)
    return { ...result, source: 'gemini', model }
  } catch (err) {
    attempt.durationMs = Date.now() - startedAt
    attempt.error = err?.message || String(err)
    diag.attempts.push(attempt)
    console.warn(`[TrustBreak AI][vision] ${model} threw after ${attempt.durationMs}ms — ${attempt.error}`)
    return null
  }
}

async function analyzeScreenshotWithGemini({ screenshotUrl, imageBase64, mimeType = 'image/png', req = null, diag }) {
  const keyInfo = resolveGeminiKey({ headerKey: req?.headers?.['x-gemini-api-key'], env: process.env })
  diag.keySource = keyInfo.source
  diag.keyFingerprint = keyFingerprint(keyInfo.key)
  diag.keyChecks = keyInfo.checked

  console.log('[TrustBreak AI][vision] key resolution', {
    source: keyInfo.source,
    fingerprint: diag.keyFingerprint,
    checked: keyInfo.checked,
  })

  if (!keyInfo.key) {
    diag.status = 'no-key'
    console.warn('[TrustBreak AI][vision] no Gemini key found — checked:', keyInfo.checked)
    return null
  }

  let base64 = null
  let contentType = mimeType || 'image/png'

  if (imageBase64) {
    const normalized = normalizeImageBase64(imageBase64)
    diag.image = {
      bytes: typeof imageBase64 === 'string' ? imageBase64.length : 0,
      validBase64: Boolean(normalized.base64),
      problem: normalized.problem,
    }
    if (!normalized.base64) {
      diag.status = 'invalid-image'
      console.warn('[TrustBreak AI][vision] image payload rejected:', normalized.problem)
      return null
    }
    base64 = normalized.base64
    contentType = normalized.mimeType || contentType
  } else if (screenshotUrl) {
    try {
      console.log('[TrustBreak AI][vision] downloading screenshot_url', screenshotUrl)
      const imageResp = await fetch(screenshotUrl)
      if (!imageResp.ok) {
        diag.status = 'image-download-failed'
        diag.image = { problem: `HTTP ${imageResp.status} while downloading screenshot_url` }
        return null
      }
      contentType = imageResp.headers.get('content-type') || 'image/png'
      const ab = await imageResp.arrayBuffer()
      base64 = Buffer.from(ab).toString('base64')
      diag.image = { bytes: base64.length, source: 'screenshot_url' }
    } catch (err) {
      diag.status = 'image-download-failed'
      diag.image = { problem: err?.message || 'download failed' }
      return null
    }
  } else {
    diag.status = 'no-image'
    console.warn('[TrustBreak AI][vision] no image supplied (image_base64 / screenshot_url both empty)')
    return null
  }

  console.log('[TrustBreak AI][vision] request start', {
    models: VISION_MODELS,
    mimeType: contentType,
    base64Bytes: base64.length,
    hedgeDelayMs: VISION_HEDGE_DELAY_MS,
    modelTimeoutMs: VISION_MODEL_TIMEOUT_MS,
  })

  diag.status = 'all-models-failed'

  // Hedged requests:
  //   - the preferred model starts immediately;
  //   - if it has not answered after VISION_HEDGE_DELAY_MS, the next model is
  //     started in parallel and the first *successful* verdict wins.
  // A model that hangs (gemini-3.8-flash did, for the full 45s) therefore
  // costs a few seconds instead of the whole scan.
  const launched = new Set()
  const pending = new Map()

  const launch = (model) => {
    if (!model || launched.has(model)) return
    launched.add(model)
    pending.set(
      model,
      callGeminiVision({ apiKey: keyInfo.key, model, base64, mimeType: contentType, diag })
        .then((result) => ({ model, result }))
        .catch((err) => ({ model, result: null, error: err?.message }))
    )
  }

  launch(VISION_MODELS[0])

  const hedgeTimer = setTimeout(() => {
    const next = VISION_MODELS.find((model) => !launched.has(model))
    if (next) {
      console.log(`[TrustBreak AI][vision] hedge — ${VISION_MODELS[0]} is slow, starting ${next} in parallel`)
      launch(next)
    }
  }, VISION_HEDGE_DELAY_MS)

  try {
    while (pending.size > 0 && launched.size <= VISION_MODELS.length + 3) {
      const settled = await Promise.race([...pending.values()])
      pending.delete(settled.model)

      if (settled.result) return settled.result

      // Read the hint from this model's own attempt record, so parallel
      // (hedged) calls cannot overwrite each other's suggestion.
      const suggestion = diag.attempts.find((a) => a.model === settled.model && a.suggestedModel)?.suggestedModel
      if (suggestion && !launched.has(suggestion)) {
        console.log(`[TrustBreak AI][vision] ${settled.model} is retired — following Google's hint to ${suggestion}`)
        launch(suggestion)
        continue
      }

      const next = VISION_MODELS.find((model) => !launched.has(model))
      if (next) launch(next)
    }
  } finally {
    clearTimeout(hedgeTimer)
  }

  diag.attemptedModels = [...launched]
  console.warn('[TrustBreak AI][vision] every model failed — see attempts', diag.attempts)
  return null
}

/**
 * Secondary vision provider. Groq serves Llama-4 vision models through an
 * OpenAI-compatible endpoint, so a deployment with GROQ_API_KEY but no Gemini
 * key can still return a genuine (not fabricated) screenshot verdict.
 */
async function analyzeScreenshotWithGroqVision({ base64, mimeType, req, diag }) {
  const keyInfo = resolveGroqKey(req)
  if (!keyInfo.key) {
    if (diag) diag.groqVision = { attempted: false, reason: keyInfo.reason }
    return null
  }
  if (!base64) return null

  const models = ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct']
  if (diag) diag.groqVision = { attempted: true, attempts: [] }

  for (const model of models) {
    const startedAt = Date.now()
    const attempt = { model, ok: false, status: null, durationMs: 0 }
    try {
      const response = await withTimeout(
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keyInfo.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: VISION_PROMPT },
                  { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${base64}` } },
                ],
              },
            ],
          }),
        }),
        VISION_TIMEOUT_MS
      )

      attempt.status = response.status
      const raw = await response.text()
      attempt.durationMs = Date.now() - startedAt

      if (!response.ok) {
        attempt.error = raw.slice(0, 300)
        if (diag) diag.groqVision.attempts.push(attempt)
        console.warn(`[TrustBreak AI][vision] Groq ${model} HTTP ${response.status} — ${attempt.error}`)
        continue
      }

      const data = JSON.parse(raw)
      const result = normalizeVisionResult(parseJsonFromText(data?.choices?.[0]?.message?.content))
      if (!result) {
        attempt.error = 'no parsable JSON verdict'
        if (diag) diag.groqVision.attempts.push(attempt)
        continue
      }

      attempt.ok = true
      attempt.score = result.fraud_score
      if (diag) diag.groqVision.attempts.push(attempt)
      console.log(`[TrustBreak AI][vision] Groq ${model} verdict ${result.fraud_score}/${result.risk_level} in ${attempt.durationMs}ms`)
      return { ...result, source: 'groq-vision', model }
    } catch (err) {
      attempt.durationMs = Date.now() - startedAt
      attempt.error = err?.message || String(err)
      if (diag) diag.groqVision.attempts.push(attempt)
      console.warn(`[TrustBreak AI][vision] Groq ${model} threw:`, attempt.error)
    }
  }

  return null
}

async function analyzeScreenshotWithOpenAI(screenshotUrl, diag = null) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !screenshotUrl) return null

  const startedAt = Date.now()
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are TrustBreak AI vision detector. Output strict JSON with keys fraud_score, risk_level, reasons, analysis, detected_text, attack_intent.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this screenshot for phishing, fraud, fake branding, or urgency.' },
              { type: 'image_url', image_url: { url: screenshotUrl } },
            ],
          },
        ],
      }),
    })

    const raw = await response.text()
    const attempt = { model: 'gpt-4.1-mini', status: response.status, ok: response.ok, durationMs: Date.now() - startedAt }
    if (diag) diag.openaiAttempt = attempt

    if (!response.ok) {
      attempt.error = raw.slice(0, 300)
      console.warn(`[TrustBreak AI][vision] OpenAI failed HTTP ${response.status} — ${attempt.error}`)
      return null
    }

    const data = JSON.parse(raw)
    const content = data?.choices?.[0]?.message?.content
    const result = normalizeVisionResult(parseJsonFromText(content))
    if (result) return { ...result, source: 'openai', model: 'gpt-4.1-mini' }

    attempt.error = 'no parsable JSON verdict'
    return null
  } catch (err) {
    if (diag) diag.openaiAttempt = { model: 'gpt-4.1-mini', ok: false, error: err?.message }
    console.warn('[TrustBreak AI][vision] OpenAI vision threw:', err?.message)
    return null
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')

  // CORS headers — required for browser extension (Feature 7)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-groq-api-key, x-gemini-api-key, x-trustbreak-debug')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { type, payload } = req.body || {}

  if (!type) {
    res.status(400).json({ error: 'type is required' })
    return
  }

  const debug = payload?.debug === true || req.headers?.['x-trustbreak-debug'] === '1'
  const requestStartedAt = Date.now()

  console.log('[TrustBreak AI] /api/analyze start', {
    type,
    debug,
    hasGroqHeader: Boolean(req.headers?.['x-groq-api-key']),
    groqEnv: getGroqConfigurationStatus(),
    target: type === 'link' ? payload?.url : undefined,
  })

  try {
    if (type === 'message') {
      // Community feed pre-check for messages
      const msgText = normalize(payload?.message || '')
      const msgHash = hashDomain(msgText.substring(0, 200))
      const communityHit = await checkCommunityFeed(msgHash)
      if (communityHit) {
        res.status(200).json(communityHit)
        return
      }

      const aiDiagnostics = { status: 'not-attempted', attempts: [] }
      let groq = null
      const aiStartedAt = Date.now()
      try {
        groq = await withTimeout(analyzeWithGroq(type, payload, req, aiDiagnostics), AI_TIMEOUT_MS)
        if (!groq && aiDiagnostics.status === 'not-attempted') aiDiagnostics.status = 'no-verdict'
      } catch (err) {
        aiDiagnostics.status = /timed out/i.test(err?.message || '') ? 'timeout' : 'error'
        aiDiagnostics.error = err?.message
        console.warn('[TrustBreak AI] Groq call for message failed:', err?.message)
      }
      console.log(`[TrustBreak AI][ai] message analysis finished in ${Date.now() - aiStartedAt}ms`, aiDiagnostics)

      if (groq) {
        // Record high-risk indicator (fire-and-forget)
        if (groq.fraud_score >= 61) {
          recordThreatIndicator(msgHash, 'message', groq.fraud_score, groq.reasonCodes || [])
        }
        if (debug) groq.ai_diagnostics = aiDiagnostics
        res.status(200).json(groq)
        return
      }

      // Fallback to heuristic — labelled so it is never mistaken for AI output.
      const fallback = {
        ...analyzeMessageContent(payload?.message || ''),
        source: 'offline-heuristic',
        engine: 'heuristic',
        degraded: true,
        degraded_reason: aiDiagnostics.status === 'no-key' ? 'ai-unavailable: no API key' : `ai-unavailable (${aiDiagnostics.status})`,
      }
      if (debug) fallback.ai_diagnostics = aiDiagnostics
      console.warn('[TrustBreak AI][verdict]', {
        type,
        engine: 'heuristic',
        degraded: true,
        score: fallback.fraud_score,
        risk: fallback.risk_level,
        reason: fallback.degraded_reason,
        elapsedMs: Date.now() - requestStartedAt,
      })
      res.status(200).json(fallback)
      return
    }

    if (type === 'link') {
      const domain = extractDomain(payload?.url || '')
      
      // Community feed pre-check
      if (domain) {
        const domainHash = hashDomain(domain)
        const communityHit = await checkCommunityFeed(domainHash)
        if (communityHit) {
          res.status(200).json(communityHit)
          return
        }

        // Public blocklist pre-check
        const blocklistHit = await checkPublicBlocklist(domainHash)
        if (blocklistHit) {
          res.status(200).json(blocklistHit)
          return
        }

        // Live feed fallback so a dead/unseeded database does not downgrade
        // known phishing domains to the heuristic engine.
        if (await checkLiveThreatFeed(domain)) {
          res.status(200).json(liveFeedVerdict(domain))
          return
        }
      }

      let groq = null
      const aiDiagnostics = { status: 'not-attempted', attempts: [] }
      const aiStartedAt = Date.now()
      try {
        groq = await withTimeout(analyzeWithGroq(type, payload, req, aiDiagnostics), AI_TIMEOUT_MS)
        if (!groq && aiDiagnostics.status === 'not-attempted') aiDiagnostics.status = 'no-verdict'
      } catch (err) {
        aiDiagnostics.status = /timed out/i.test(err?.message || '') ? 'timeout' : 'error'
        aiDiagnostics.error = err?.message
        console.warn('[TrustBreak AI] Groq call for link failed:', err?.message)
      }
      console.log(`[TrustBreak AI][ai] link analysis finished in ${Date.now() - aiStartedAt}ms`, aiDiagnostics)

      const base = analyzeUrlContent(payload?.url || '', {
        domain_age_days: payload?.domain_age_days,
        community_reports: payload?.community_reports,
        known_malicious: payload?.known_malicious,
        page_title: payload?.title || payload?.page_title,
        page_text: payload?.page_text || payload?.content,
        debug,
      })
      if (groq) {
        const combined = {
          ...base,
          ...groq,
          trust_profile: base.trust_profile,
          simulation_steps: base.simulation_steps,
          engine: 'groq',
          degraded: false,
        }
        // Record high-risk indicator (fire-and-forget)
        if (combined.fraud_score >= 61 && domain) {
          recordThreatIndicator(hashDomain(domain), 'link', combined.fraud_score, combined.reasonCodes || [])
        }
        if (debug) combined.ai_diagnostics = aiDiagnostics
        console.log('[TrustBreak AI][verdict]', {
          type,
          engine: 'groq',
          degraded: false,
          score: combined.fraud_score,
          risk: combined.risk_level,
          elapsedMs: Date.now() - requestStartedAt,
        })
        res.status(200).json(combined)
        return
      }

      // Fallback to heuristic — explicitly labelled so clients never present a
      // degraded result as a full AI/threat-intel verdict.
      const fallback = {
        ...base,
        source: 'offline-heuristic',
        engine: 'heuristic',
        degraded: true,
        degraded_reason: aiDiagnostics.status === 'no-key' ? 'ai-unavailable: no API key' : `ai-unavailable (${aiDiagnostics.status})`,
      }
      if (debug) fallback.ai_diagnostics = aiDiagnostics
      console.warn('[TrustBreak AI][verdict]', {
        type,
        engine: 'heuristic',
        degraded: true,
        score: fallback.fraud_score,
        risk: fallback.risk_level,
        testPage: fallback.is_security_test_page ? fallback.security_test_page : false,
        reason: fallback.degraded_reason,
        breakdown: fallback.score_breakdown,
        elapsedMs: Date.now() - requestStartedAt,
      })
      res.status(200).json(fallback)
      return
    }

    if (type === 'report') {
      let groq = null
      try {
        groq = await withTimeout(analyzeWithGroq(type, payload, req), AI_TIMEOUT_MS)
      } catch (err) {
        console.warn('[TrustBreak AI] Groq timed out or failed for report:', err.message)
      }

      if (groq) {
        res.status(200).json({ ...groq, source: 'groq' })
        return
      }
      res.status(200).json({
        ...analyzeScamReportContent(payload || {}),
        source: 'offline-heuristic',
        engine: 'heuristic',
        degraded: true,
        degraded_reason: 'ai-unavailable',
        reasonCodes: [],
        explanation: null,
      })
      return
    }

    if (type === 'screenshot') {
      const hasImage = Boolean(payload?.screenshot_url || payload?.image_base64)
      const keyInfo = resolveGeminiKey({ headerKey: req.headers?.['x-gemini-api-key'], env: process.env })
      const visionDiagnostics = {
        hasImage,
        imageBytes: typeof payload?.image_base64 === 'string' ? payload.image_base64.length : 0,
        mimeType: payload?.mime_type || null,
        geminiConfigured: Boolean(keyInfo.key),
        keySource: keyInfo.source,
        keyFingerprint: keyFingerprint(keyInfo.key),
        keyChecks: keyInfo.checked,
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        groqConfigured: Boolean(process.env.GROQ_API_KEY),
        models: [...VISION_MODELS],
        status: 'not-attempted',
        attempts: [],
      }

      console.log('[TrustBreak AI][vision] request received', {
        hasImage,
        imageBytes: visionDiagnostics.imageBytes,
        mimeType: payload?.mime_type || null,
        clientKeyHeader: Boolean(req.headers?.['x-gemini-api-key']),
        serverKey: getGeminiConfigurationStatus(),
      })

      if (!hasImage) {
        visionDiagnostics.status = 'no-image'
        console.warn('[TrustBreak AI] screenshot request carried no image payload — refusing to invent a score')
      }

      let ai = null
      if (hasImage) {
        try {
          ai = await withTimeout(
            (async () => {
              const gemini = await analyzeScreenshotWithGemini({
                screenshotUrl: payload?.screenshot_url,
                imageBase64: payload?.image_base64,
                mimeType: payload?.mime_type,
                req,
                diag: visionDiagnostics,
              })
              if (gemini) return gemini

              // Second real provider — Groq Llama-4 Vision, when available.
              const groqVision = await analyzeScreenshotWithGroqVision({
                base64: payload?.image_base64 ? normalizeImageBase64(payload.image_base64).base64 : null,
                mimeType: payload?.mime_type,
                req,
                diag: visionDiagnostics,
              })
              if (groqVision) return groqVision
              // Only blame "every provider" when Gemini actually had a key and
              // rejected it; a missing key keeps its more specific status.
              if (visionDiagnostics.groqVision?.attempted && visionDiagnostics.status === 'all-models-failed') {
                visionDiagnostics.status = 'all-providers-failed'
              }

              return analyzeScreenshotWithOpenAI(payload?.screenshot_url, visionDiagnostics)
            })(),
            Math.max(VISION_TIMEOUT_MS, AI_TIMEOUT_MS * 2)
          )
        } catch (err) {
          visionDiagnostics.status = /timed out/i.test(err?.message || '') ? 'timeout' : 'error'
          visionDiagnostics.timeoutError = err?.message
          console.warn('[TrustBreak AI] Vision AI timed out or failed:', err.message)
        }
      }

      if (ai) {
        const verdict = { ...ai, engine: ai.source, degraded: false }
        if (debug) verdict.vision_diagnostics = visionDiagnostics
        console.log('[TrustBreak AI][verdict]', {
          type,
          engine: verdict.engine,
          model: verdict.model,
          score: verdict.fraud_score,
          risk: verdict.risk_level,
          hasOcrText: Boolean(verdict.detected_text),
          elapsedMs: Date.now() - requestStartedAt,
        })
        res.status(200).json(verdict)
        return
      }

      // Never fabricate a score: without an image (or without a working vision
      // key) the honest answer is "not analyzed" — but we always say *why*.
      const degradedReason = !hasImage
        ? 'no-image-payload'
        : visionDiagnostics.status === 'no-key'
          ? 'gemini-key-missing'
          : visionDiagnostics.status === 'timeout'
            ? 'gemini-timeout'
            : visionDiagnostics.status === 'invalid-image'
              ? 'invalid-image-payload'
              : visionDiagnostics.status === 'image-download-failed'
                ? 'image-download-failed'
                : visionDiagnostics.status === 'all-providers-failed'
                  ? 'vision-providers-failed'
                  : 'gemini-call-failed'

      const fallback = {
        ...analyzeScreenshotFallback(payload?.detected_text || '', { reason: degradedReason }),
        source: 'offline-heuristic',
        engine: 'heuristic',
        degraded: true,
        degraded_reason: degradedReason,
        explanation: null,
        vision_diagnostics: visionDiagnostics,
      }
      console.warn('[TrustBreak AI][verdict]', {
        type,
        engine: 'heuristic',
        degraded: true,
        status: fallback.analysis_status,
        reason: fallback.degraded_reason,
        visionStatus: visionDiagnostics.status,
        attempts: visionDiagnostics.attempts,
        elapsedMs: Date.now() - requestStartedAt,
      })
      res.status(200).json(fallback)
      return
    }

    res.status(400).json({ error: 'Unsupported analysis type' })
  } catch (error) {
    console.error('[TrustBreak AI API Error]', error)
    res.status(500).json({
      error: 'Analysis could not be completed at this time.',
      fallback: { ...analyzeMessageContent(payload?.message || ''), source: 'offline-heuristic' }
    })
  }
}

export {
  withTimeout,
  safeParseVerdict,
  parseJsonFromText,
  hashDomain,
  extractDomain,
  getSupabaseReadClient,
  getSupabaseServiceClient,
  supabaseFetch,
  supabaseFetchUpsert,
  checkCommunityFeed,
  checkPublicBlocklist,
  recordThreatIndicator,
}
