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
import crypto from 'node:crypto'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonFromText(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

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

function normalizeVisionResult(parsed) {
  if (!parsed || typeof parsed !== 'object') return null
  const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
  const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score)
  const verdict = safeParseVerdict(JSON.stringify(parsed))
  
  return {
    fraud_score: score,
    risk_level: risk,
    confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((r) => String(r)) : [],
    analysis: String(parsed.analysis || parsed.ai_analysis || ''),
    ai_analysis: String(parsed.ai_analysis || parsed.analysis || ''),
    detected_text: String(parsed.detected_text || ''),
    attack_intent: parsed.attack_intent || inferAttackerIntent(parsed.detected_text || '', '', risk),
    threat_reconstruction: reconstructAttackChain(parsed.detected_text || 'Screenshot image analysis', '', risk),
    reasonCodes: verdict?.reasonCodes || [],
    explanation: verdict?.explanation || null,
  }
}

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
      analysis: 'This indicator was flagged as high-risk by multiple prior GhostNet scans and recorded in the community threat intelligence feed.',
      ai_analysis: 'Community threat feed match.',
      reasonCodes: filterValidReasonCodes(row.reason_codes || []),
      explanation: 'Matched community threat intelligence feed.',
      source: 'community-threat-feed',
      attack_intent: 'Previously identified malicious indicator — see original scan for full reconstruction.',
      threat_reconstruction: [],
      emergency_actions: {
        stop: 'Do NOT interact with this content.',
        verify: 'This indicator was confirmed malicious by prior community scans.',
        report: 'Already recorded in the GhostNet community threat database.',
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

function getValidGroqKey(req = null) {
  const headerKey = req?.headers?.['x-groq-api-key']
  if (headerKey && typeof headerKey === 'string' && !headerKey.includes('placeholder') && !headerKey.includes('your_groq')) {
    return headerKey.trim()
  }
  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!key || typeof key !== 'string' || key.includes('placeholder') || key.includes('your_groq')) return null
  return key.trim()
}

function getValidGeminiKey(req = null) {
  const headerKey = req?.headers?.['x-gemini-api-key']
  if (headerKey && typeof headerKey === 'string' && !headerKey.includes('placeholder') && !headerKey.includes('your_gemini')) {
    return headerKey.trim()
  }
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
  if (!key || typeof key !== 'string' || key.includes('placeholder') || key.includes('your_gemini')) return null
  return key.trim()
}

async function analyzeWithGroq(type, payload, req = null) {
  const apiKey = getValidGroqKey(req)
  if (!apiKey) return null

  let prompt = ''
  if (type === 'message') {
    prompt = `You are GhostNet AI, an elite cybersecurity fraud and phishing detection engine.
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
    prompt = `You are GhostNet AI, an elite cybersecurity URL and domain inspection engine.
Analyze this URL for phishing, typosquatting, lookalike domains, credential harvesting, or deceptive redirects.

URL:
"""${payload?.url || ''}"""

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
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are GhostNet AI. Always respond in strict, valid JSON format only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) continue
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      const parsed = parseJsonFromText(text)
      if (parsed && typeof parsed.fraud_score !== 'undefined') {
        const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
        const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score)
        const contentStr = type === 'message' ? payload.message : (payload.url || '')
        const verdict = safeParseVerdict(text)
        
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
          emergency_actions: {
            stop: 'Do NOT click any links, enter PINs, or share verification codes.',
            verify: 'Call the organization using their known official hotline.',
            report: 'Record this threat in the GhostNet community database.',
            secure: 'Freeze affected cards or rotate credentials immediately if compromised.'
          }
        }
      }
    } catch {
      continue
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Gemini + OpenAI vision analysis (unchanged behavior)
// ---------------------------------------------------------------------------

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

async function analyzeScreenshotWithGemini(screenshotUrl, imageBase64 = null, mimeType = 'image/png', req = null) {
  const apiKey = getValidGeminiKey(req)
  if (!apiKey || (!screenshotUrl && !imageBase64)) return null

  try {
    let base64 = imageBase64
    let contentType = mimeType || 'image/png'

    if (!base64 && screenshotUrl) {
      const imageResp = await fetch(screenshotUrl)
      if (!imageResp.ok) return null
      contentType = imageResp.headers.get('content-type') || 'image/png'
      const ab = await imageResp.arrayBuffer()
      base64 = Buffer.from(ab).toString('base64')
    }

    if (!base64) return null

    const prompt = `Analyze this screenshot for cyber scam, phishing, brand impersonation, urgency manipulation, payment fraud, QR code traps, or social engineering.
Return strict JSON only with keys:
- fraud_score (number 0-100)
- risk_level (safe|suspicious|scam)
- confidence (low|medium|high)
- reasons (array of specific visual and textual evidence strings)
- analysis (professional summary of the visual threat)
- detected_text (all OCR extracted text from the image)
- attack_intent (what the fraudster is attempting to achieve)
${REASON_CODES_INSTRUCTION}`

    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: contentType,
                        data: base64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          }
        )

        if (!response.ok) continue
        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join(' ') || ''
        const result = normalizeVisionResult(parseJsonFromText(text))
        if (result) return { ...result, source: 'gemini' }
      } catch {
        continue
      }
    }
    return null
  } catch {
    return null
  }
}

async function analyzeScreenshotWithOpenAI(screenshotUrl) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !screenshotUrl) return null

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
            content: 'You are GhostNet AI vision detector. Output strict JSON with keys fraud_score, risk_level, reasons, analysis, detected_text, attack_intent.',
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

    if (!response.ok) return null
    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    const result = normalizeVisionResult(parseJsonFromText(content))
    if (result) return { ...result, source: 'openai' }
    return null
  } catch {
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

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

      let groq = null
      try {
        groq = await withTimeout(analyzeWithGroq(type, payload, req), AI_TIMEOUT_MS)
      } catch (err) {
        console.warn('[GhostNet] Groq timed out or failed for message:', err.message)
      }

      if (groq) {
        // Record high-risk indicator (fire-and-forget)
        if (groq.fraud_score >= 60) {
          recordThreatIndicator(msgHash, 'message', groq.fraud_score, groq.reasonCodes || [])
        }
        res.status(200).json(groq)
        return
      }

      // Fallback to heuristic
      const fallback = { ...analyzeMessageContent(payload?.message || ''), source: 'offline-heuristic' }
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
      }

      let groq = null
      try {
        groq = await withTimeout(analyzeWithGroq(type, payload, req), AI_TIMEOUT_MS)
      } catch (err) {
        console.warn('[GhostNet] Groq timed out or failed for link:', err.message)
      }

      const base = analyzeUrlContent(payload?.url || '')
      if (groq) {
        const combined = {
          ...base,
          ...groq,
          trust_profile: base.trust_profile,
          simulation_steps: base.simulation_steps,
        }
        // Record high-risk indicator (fire-and-forget)
        if (combined.fraud_score >= 60 && domain) {
          recordThreatIndicator(hashDomain(domain), 'link', combined.fraud_score, combined.reasonCodes || [])
        }
        res.status(200).json(combined)
        return
      }

      // Fallback to heuristic
      const fallback = { ...base, source: 'offline-heuristic' }
      res.status(200).json(fallback)
      return
    }

    if (type === 'report') {
      let groq = null
      try {
        groq = await withTimeout(analyzeWithGroq(type, payload, req), AI_TIMEOUT_MS)
      } catch (err) {
        console.warn('[GhostNet] Groq timed out or failed for report:', err.message)
      }

      if (groq) {
        res.status(200).json({ ...groq, source: 'groq' })
        return
      }
      res.status(200).json({ ...analyzeScamReportContent(payload || {}), source: 'offline-heuristic', reasonCodes: [], explanation: null })
      return
    }

    if (type === 'screenshot') {
      let ai = null
      try {
        ai = await withTimeout(
          (async () => {
            const gemini = await analyzeScreenshotWithGemini(payload?.screenshot_url, payload?.image_base64, payload?.mime_type, req)
            if (gemini) return gemini
            return analyzeScreenshotWithOpenAI(payload?.screenshot_url)
          })(),
          AI_TIMEOUT_MS * 2 // give screenshots extra time
        )
      } catch (err) {
        console.warn('[GhostNet] Vision AI timed out or failed:', err.message)
      }

      res.status(200).json(ai || { ...analyzeScreenshotFallback(), source: 'offline-heuristic', reasonCodes: [], explanation: null })
      return
    }

    res.status(400).json({ error: 'Unsupported analysis type' })
  } catch (error) {
    console.error('[GhostNet API Error]', error)
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
