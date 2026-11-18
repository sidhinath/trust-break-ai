import { inferAttackerIntent, reconstructAttackChain, scoreToRisk } from './scanner.js'
import { filterValidReasonCodes } from './reasonCodes.js'

/**
 * Single source of truth for the vision pipeline.
 *
 * Both the serverless route (api/analyze.js, api/vision-health.js) and the
 * browser client (src/lib/api.js) import from here so the model names, prompt,
 * environment variable names and response normalisation can never drift apart.
 */

/**
 * Models are tried in order. `gemini-flash-latest` is an alias that stays valid
 * across releases, so it keeps working even if a pinned model is retired.
 */
export const VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
]

/**
 * Every environment variable name we accept for the Gemini key, in priority
 * order. GEMINI_API_KEY is the documented one; the rest are accepted so a key
 * stored under a different (but common) name still works instead of silently
 * disabling vision.
 */
export const GEMINI_KEY_ENV_NAMES = [
  'GEMINI_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GOOGLE_API_KEY',
  'GEMINI_KEY',
  'VITE_GEMINI_API_KEY',
]

const PLACEHOLDER_MARKERS = [
  'placeholder',
  'your_gemini',
  'your-gemini',
  'your_gemini_api_key',
  'changeme',
  'insert-key',
  '<your',
]

export const VISION_REASON_CODES = `- reasonCodes (array of strings, choose ONLY from this exact list, pick all that apply):
  URGENCY_LANGUAGE, IMPERSONATES_BRAND, REQUESTS_OTP, LOOKALIKE_DOMAIN, PUNYCODE_DOMAIN,
  NEWLY_REGISTERED_DOMAIN, REQUESTS_PAYMENT, KNOWN_MALICIOUS_DOMAIN, SUSPICIOUS_ATTACHMENT_QR, GENERIC_GREETING
- explanation (concise 1-2 sentence plain-English summary of the top threat factor)`

export const VISION_PROMPT = `You are TrustBreak AI, a multi-modal cyber-fraud detection engine.
Analyze this screenshot for cyber scam, phishing, brand impersonation, urgency manipulation, payment fraud, QR code traps, or social engineering.
Return strict JSON only with keys:
- fraud_score (number 0-100)
- risk_level (safe|suspicious|scam)
- confidence (low|medium|high)
- reasons (array of specific visual and textual evidence strings)
- analysis (professional summary of the visual threat)
- detected_text (all OCR extracted text from the image)
- attack_intent (what the fraudster is attempting to achieve)
${VISION_REASON_CODES}

Scoring rules (follow them exactly):
- 0-25 = safe: ordinary screenshots such as app dashboards, terminals, code editors, photos, receipts, or normal chats with no deception cues. Return risk_level "safe" and few or no reasons.
- 26-60 = suspicious: some pressure/financial wording or an unverifiable claim, but no clear malicious intent.
- 61-100 = scam: explicit credential/OTP requests, payment demands to unverified parties, fake bank/government notices, brand impersonation, or lookalike payment links.
Only flag what is actually visible in the image. Do not assume fraud when the screenshot is an ordinary user interface or a technical/developer screen.`

/**
 * Normalises a raw key value copied from a dashboard, `.env` file or docs.
 *
 * Values pasted into Vercel's "Value" box very often arrive with a trailing
 * newline, surrounding quotes, smart quotes, a `KEY=value` prefix or a
 * `Bearer ` prefix. Those all made the old validator reject an otherwise
 * perfectly valid Google key, which is why vision reported "unavailable"
 * even though the environment variable existed.
 */
export function sanitizeKeyValue(rawValue) {
  if (typeof rawValue !== 'string') return ''

  let value = rawValue
    // Zero-width characters sneak in from copy/paste out of docs.
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    // Smart/typographic quotes normalised to a plain double quote.
    .replace(/[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u2032\u2033]/g, '"')
    .trim()

  // A value like `GEMINI_API_KEY=AIza...` (env-file line pasted whole).
  const assignment = value.match(/^\s*(?:export\s+)?[A-Z][A-Z0-9_]{2,}\s*=\s*([\s\S]+)$/)
  if (assignment) value = assignment[1]

  return value
    .replace(/^Bearer\s+/i, '')
    // API keys never contain whitespace; leaving it in guarantees a 400.
    .replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g, '')
    .replace(/^["'`]+|["'`]+$/g, '')
}

/**
 * Google API keys come in two shapes:
 *   AIza...   classic keys
 *   AQ....    keys issued after Google's 2025 format change (contain a dot)
 * Both are valid for the Generative Language API, so dots must be allowed.
 */
const VALID_KEY_CHARACTER = /[A-Za-z0-9_.-]/
const VALID_KEY_SHAPE = /^[A-Za-z0-9_.-]{20,}$/

/**
 * Points at the first character that makes a key unusable, without printing
 * the secret itself. Reporting the position is what turns "vision unavailable"
 * into an actionable message.
 */
function describeInvalidCharacter(value) {
  const chars = Array.from(value)
  const index = chars.findIndex((ch) => !VALID_KEY_CHARACTER.test(ch))
  if (index < 0) return null

  const ch = chars[index]
  const code = ch.codePointAt(0)
  const label = /\s/.test(ch)
    ? 'whitespace'
    : code < 32 || code > 126
      ? `non-ASCII character (U+${code.toString(16).toUpperCase().padStart(4, '0')})`
      : `character "${ch}"`

  return `${label} at position ${index + 1}`
}

/**
 * Google keys start with AIza (classic) or AQ. (current format). Anything else
 * is still attempted, but the diagnostics say so up front.
 */
export function describeKeyShape(key) {
  if (!key) return 'unknown'
  if (key.startsWith('AIza')) return 'Google API key (AIza…)'
  if (key.startsWith('AQ.')) return 'Google API key (AQ.…, current format)'
  if (key.startsWith('gsk_')) return 'Groq API key — not a Google key'
  if (key.startsWith('sk-') || key.startsWith('sk.')) return 'OpenAI/Anthropic-style key — not a Google key'
  if (key.startsWith('hf_')) return 'Hugging Face token — not a Google key'
  if (key.startsWith('xai-')) return 'xAI key — not a Google key'
  return 'unrecognised format'
}

/**
 * Validates an API key value and reports *why* it is unusable. The value is
 * cleaned first, so harmless paste artifacts no longer disable vision.
 */
export function inspectKey(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return { key: null, problem: 'is not set' }
  }
  if (typeof rawValue !== 'string') return { key: null, problem: 'is not a string' }

  const original = rawValue
  const cleanedValue = sanitizeKeyValue(original)
  if (!cleanedValue) return { key: null, problem: 'is empty' }

  const lower = cleanedValue.toLowerCase()
  if (PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker))) {
    return { key: null, problem: 'is a placeholder value' }
  }
  if (cleanedValue.length < 20) {
    return { key: null, problem: `looks truncated (${cleanedValue.length} chars after cleanup)` }
  }

  const invalid = describeInvalidCharacter(cleanedValue)
  if (invalid) {
    return { key: null, problem: `contains unexpected characters — ${invalid}` }
  }
  if (!VALID_KEY_SHAPE.test(cleanedValue)) {
    return { key: null, problem: 'has an unexpected shape' }
  }

  return {
    key: cleanedValue,
    source: null,
    problem: null,
    cleaned: cleanedValue !== original.trim(),
    length: cleanedValue.length,
    shape: describeKeyShape(cleanedValue),
  }
}

/**
 * Never log a full key. This fingerprint is enough to confirm *which* key a
 * deployment picked up without exposing it.
 */
export function keyFingerprint(key) {
  if (!key || typeof key !== 'string') return null
  const trimmed = sanitizeKeyValue(key)
  if (!trimmed) return null
  if (trimmed.length < 12) return `*** (${trimmed.length} chars)`
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)} (${trimmed.length} chars)`
}

/**
 * Resolves the Gemini key from the request header first, then from the server
 * environment. Returns the resolved key plus a full audit trail of what was
 * checked, so "vision unavailable" can never be a mystery again.
 */
export function resolveGeminiKey({ headerKey, env = null } = {}) {
  const checked = []

  const fromHeader = inspectKey(headerKey)
  checked.push({
    source: 'x-gemini-api-key header',
    status: fromHeader.key ? 'ok' : fromHeader.problem,
    length: fromHeader.length ?? null,
    shape: fromHeader.shape ?? null,
    cleaned: Boolean(fromHeader.cleaned),
  })
  if (fromHeader.key) {
    return {
      key: fromHeader.key,
      source: 'x-gemini-api-key header',
      checked,
      cleaned: Boolean(fromHeader.cleaned),
      shape: fromHeader.shape ?? null,
    }
  }

  const environment = env || (typeof process !== 'undefined' ? process.env : null)
  if (environment) {
    for (const name of GEMINI_KEY_ENV_NAMES) {
      const found = inspectKey(environment[name])
      checked.push({
        source: name,
        status: found.key ? 'ok' : found.problem,
        length: found.length ?? null,
        shape: found.shape ?? null,
        cleaned: Boolean(found.cleaned),
      })
      if (found.key) {
        return {
          key: found.key,
          source: `${name} env var`,
          checked,
          cleaned: Boolean(found.cleaned),
          shape: found.shape ?? null,
        }
      }
    }
  } else {
    checked.push({ source: 'process.env', status: 'not available in this runtime' })
  }

  return { key: null, source: 'none', checked, cleaned: false, shape: null }
}

/**
 * Strips a `data:image/png;base64,` prefix and rejects obviously invalid data.
 */
export function normalizeImageBase64(input) {
  if (!input || typeof input !== 'string') return { base64: null, mimeType: null, problem: 'no image data' }
  let value = input.trim()
  let mimeType = null
  if (value.startsWith('data:')) {
    const [meta, data] = value.split(',')
    mimeType = meta?.match(/data:([^;]+)/)?.[1] || null
    value = data || ''
  }
  value = value.replace(/\s+/g, '')
  if (!value) return { base64: null, mimeType, problem: 'image data is empty' }
  if (!/^[A-Za-z0-9+/=_-]+$/.test(value)) {
    return { base64: null, mimeType, problem: 'image data is not valid base64' }
  }
  return { base64: value, mimeType, problem: null }
}

/**
 * Builds the Gemini generateContent request body.
 * `thinkingConfig` is only sent to 2.5 models (older models reject the field),
 * and thinking is disabled so a screenshot verdict returns in ~2s instead of
 * burning the request timeout.
 */
export function buildVisionRequestBody(base64, mimeType = 'image/jpeg', model = '') {
  const generationConfig = {
    temperature: 0.2,
    responseMimeType: 'application/json',
  }
  if (model.includes('2.5')) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 }
  }

  return {
    contents: [
      {
        role: 'user',
        parts: [
          { text: VISION_PROMPT },
          { inline_data: { mime_type: mimeType || 'image/jpeg', data: base64 } },
        ],
      },
    ],
    generationConfig,
  }
}

export function parseJsonFromText(text) {
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

export function extractGeminiText(data) {
  const candidate = data?.candidates?.[0]
  const parts = candidate?.content?.parts || []
  return parts.map((p) => p.text || '').join(' ').trim()
}

export function describeGeminiFailure(data) {
  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) return `prompt blocked by safety filter (${blockReason})`
  const finishReason = data?.candidates?.[0]?.finishReason
  if (finishReason && finishReason !== 'STOP') return `generation stopped early (${finishReason})`
  return 'model returned no parsable JSON verdict'
}

/**
 * Normalises a model verdict into the internal contract.
 */
export function normalizeVisionResult(parsed) {
  if (!parsed || typeof parsed !== 'object') return null
  if (parsed.fraud_score === undefined && parsed.risk_level === undefined) return null

  const score = Math.max(0, Math.min(100, Number(parsed.fraud_score ?? 0)))
  const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level)
    ? parsed.risk_level
    : scoreToRisk(score)
  const detectedText = String(parsed.detected_text || '')

  return {
    fraud_score: score,
    risk_level: risk,
    confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((r) => String(r)) : [],
    analysis: String(parsed.analysis || parsed.ai_analysis || ''),
    ai_analysis: String(parsed.ai_analysis || parsed.analysis || ''),
    detected_text: detectedText,
    attack_intent: parsed.attack_intent || inferAttackerIntent(detectedText, '', risk),
    threat_reconstruction: reconstructAttackChain(detectedText || 'Screenshot image analysis', '', risk),
    reasonCodes: filterValidReasonCodes(parsed.reasonCodes || parsed.reason_codes || []),
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : null,
  }
}
