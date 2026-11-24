import {
  analyzeMessageContent,
  analyzeScamReportContent,
  analyzeScreenshotFallback,
  analyzeUrlContent,
  scoreToRisk,
  inferAttackerIntent,
  extractAttackSignals,
  reconstructAttackChain,
  findSimilarScams,
  inferReasonCodes,
} from './scanner.js'
import { filterValidReasonCodes } from './reasonCodes.js'
import {
  VISION_MODELS,
  buildVisionRequestBody,
  extractGeminiText,
  normalizeVisionResult,
  parseJsonFromText,
} from './vision.js'

function getGroqKey() {
  let key = ''
  try {
    key = localStorage.getItem('trustbreak_groq_api_key') || import.meta.env?.VITE_GROQ_API_KEY || import.meta.env?.GROQ_API_KEY || ''
  } catch {
    key = import.meta.env?.VITE_GROQ_API_KEY || import.meta.env?.GROQ_API_KEY || ''
  }
  if (!key || typeof key !== 'string' || key.includes('placeholder') || key.includes('your_groq')) return ''
  return key.trim()
}

function getGeminiKey() {
  let key = ''
  try {
    key = localStorage.getItem('trustbreak_gemini_api_key')
      || import.meta.env?.VITE_GEMINI_API_KEY
      || import.meta.env?.VITE_GOOGLE_API_KEY
      || import.meta.env?.GEMINI_API_KEY
      || ''
  } catch {
    key = import.meta.env?.VITE_GEMINI_API_KEY
      || import.meta.env?.VITE_GOOGLE_API_KEY
      || import.meta.env?.GEMINI_API_KEY
      || ''
  }
  if (!key || typeof key !== 'string' || key.includes('placeholder') || key.includes('your_gemini')) return ''
  return key.trim()
}

async function analyzeWithClientGroq(type, payload) {
  const apiKey = getGroqKey()
  if (!apiKey) return null

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
- reasonCodes (array of string codes: URGENCY_LANGUAGE, IMPERSONATES_BRAND, REQUESTS_OTP, LOOKALIKE_DOMAIN, REQUESTS_PAYMENT)`
  } else if (type === 'link') {
    prompt = `You are TrustBreak AI, an elite cybersecurity URL and domain inspection engine.
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
- reasonCodes (array of string codes: URGENCY_LANGUAGE, IMPERSONATES_BRAND, REQUESTS_OTP, LOOKALIKE_DOMAIN, REQUESTS_PAYMENT)`
  } else {
    return null
  }

  const models = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768']
  for (const model of models) {
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
            { role: 'system', content: 'You are TrustBreak AI. Respond in strict JSON only.' },
            { role: 'user', content: prompt },
          ],
        }),
      })

      if (!response.ok) continue
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) continue
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed.fraud_score !== 'undefined') {
        const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
        const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score)
        const contentStr = type === 'message' ? payload.message : (payload.url || '')

        return {
          fraud_score: score,
          risk_level: risk,
          confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((r) => String(r)) : [],
          analysis: String(parsed.analysis || ''),
          ai_analysis: String(parsed.analysis || ''),
          attack_intent: String(parsed.attack_intent || inferAttackerIntent(contentStr, '', risk)),
          signals: extractAttackSignals(contentStr),
          threat_reconstruction: reconstructAttackChain(contentStr, type === 'link' ? payload.url : '', risk),
          similar_patterns: findSimilarScams(contentStr),
          reasonCodes: filterValidReasonCodes(parsed.reasonCodes || inferReasonCodes(contentStr, type === 'link' ? payload.url : '', {}, risk)),
          source: 'groq',
          emergency_actions: {
            stop: 'Do NOT click any links, enter PINs, or share verification codes.',
            verify: 'Call the organization using their official verified hotline.',
            report: 'Record this threat in the TrustBreak AI community database.',
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

async function analyzeWithClientGemini(payload, diag = null) {
  const apiKey = getGeminiKey()
  const trailer = diag || {}
  trailer.attempted = Boolean(apiKey)
  trailer.attempts = trailer.attempts || []

  if (!apiKey) {
    trailer.skipped = 'no client Gemini key in localStorage/import.meta.env'
    return null
  }
  if (!payload?.image_base64) {
    trailer.skipped = 'no image_base64 to send'
    return null
  }

  for (const model of VISION_MODELS) {
    const startedAt = Date.now()
    const attempt = { model, ok: false, status: null, durationMs: 0 }
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      const headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      }

      let response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildVisionRequestBody(payload.image_base64, payload.mime_type || 'image/jpeg', model)),
      })
      let raw = await response.text()

      // A model that rejects `thinkingConfig` still works without it.
      if (response.status === 400 && /thinking|Unknown name/i.test(raw)) {
        attempt.thinkingConfigDropped = true
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(
            buildVisionRequestBody(payload.image_base64, payload.mime_type || 'image/jpeg', model, { thinking: false })
          ),
        })
        raw = await response.text()
      }

      attempt.status = response.status
      attempt.durationMs = Date.now() - startedAt

      if (!response.ok) {
        attempt.error = raw.slice(0, 300)
        trailer.attempts.push(attempt)
        console.warn(`[TrustBreak AI][vision-client] ${model} HTTP ${response.status}`, attempt.error)
        continue
      }

      const data = JSON.parse(raw)
      const parsed = parseJsonFromText(extractGeminiText(data))
      const result = normalizeVisionResult(parsed)

      if (!result) {
        attempt.error = 'model returned no parsable JSON verdict'
        trailer.attempts.push(attempt)
        console.warn(`[TrustBreak AI][vision-client] ${model} gave no verdict`)
        continue
      }

      attempt.ok = true
      attempt.score = result.fraud_score
      attempt.risk = result.risk_level
      trailer.attempts.push(attempt)
      console.log(`[TrustBreak AI][vision-client] ${model} verdict ${result.fraud_score}/${result.risk_level} in ${attempt.durationMs}ms`)
      return { ...result, source: 'gemini', model }
    } catch (err) {
      attempt.durationMs = Date.now() - startedAt
      attempt.error = err?.message || String(err)
      trailer.attempts.push(attempt)
      console.warn(`[TrustBreak AI][vision-client] ${model} threw:`, attempt.error)
    }
  }

  return null
}

async function analyzeVoiceWithClientGemini(payload) {
  const apiKey = getGeminiKey()
  if (!apiKey) return null

  const prompt = `You are TrustBreak AI, an elite voice call scam, deepfake, voice cloning, and social engineering threat detector.
Analyze this audio recording or transcript for synthesized voice indicators, emergency extortion traps, banking impersonation, OTP coercion, and financial fraud.
Return strict JSON only with keys:
- transcript (string - verbatim transcription of all spoken words)
- fraud_score (number 0-100)
- risk_level ("safe" | "suspicious" | "scam")
- confidence ("low" | "medium" | "high")
- reasons (array of specific vocal and speech evidence strings)
- analysis (professional summary of the voice call threat and acoustic/speech assessment)
- attack_intent (plain-English summary of what the caller is trying to accomplish)
- reasonCodes (array of string codes: URGENCY_LANGUAGE, IMPERSONATES_BRAND, REQUESTS_OTP, REQUESTS_PAYMENT)`

  const parts = [{ text: prompt }]
  if (payload.audio_base64) {
    parts.push({
      inline_data: {
        mime_type: payload.mime_type || 'audio/webm',
        data: payload.audio_base64,
      },
    })
  } else if (payload.transcript_text) {
    parts.push({ text: `Transcript: """${payload.transcript_text}"""` })
  } else {
    return null
  }

  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
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
      if (!text) continue
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed.fraud_score !== 'undefined') {
        const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
        const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score)

        return {
          transcript: String(parsed.transcript || payload.transcript_text || 'Audio recording analyzed'),
          fraud_score: score,
          risk_level: risk,
          confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((r) => String(r)) : [],
          analysis: String(parsed.analysis || parsed.ai_analysis || ''),
          ai_analysis: String(parsed.ai_analysis || parsed.analysis || ''),
          attack_intent: String(parsed.attack_intent || inferAttackerIntent(parsed.transcript || '', '', risk)),
          threat_reconstruction: reconstructAttackChain(parsed.transcript || 'Voice recording analysis', '', risk),
          reasonCodes: filterValidReasonCodes(parsed.reasonCodes || []),
          source: 'gemini',
        }
      }
    } catch {
      continue
    }
  }
  return null
}

async function analyzeVoiceWithClientGroq(payload) {
  const apiKey = getGroqKey()
  if (!apiKey) return null

  let transcript = payload.transcript_text || ''

  if (!transcript && payload.audio_base64) {
    try {
      const binary = atob(payload.audio_base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const ext = payload.mime_type?.includes('mp3') ? 'mp3' : payload.mime_type?.includes('wav') ? 'wav' : 'webm'
      const blob = new Blob([bytes.buffer], { type: payload.mime_type || 'audio/webm' })

      const formData = new FormData()
      formData.append('file', blob, `audio.${ext}`)
      formData.append('model', 'whisper-large-v3')

      const whisperResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      })

      if (whisperResp.ok) {
        const data = await whisperResp.json()
        transcript = data.text || ''
      }
    } catch (err) {
      console.warn('Client Groq Whisper transcription failed:', err)
    }
  }

  if (!transcript) return null

  const models = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768']
  for (const model of models) {
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
            { role: 'system', content: 'You are TrustBreak AI voice detector. Respond in strict JSON only.' },
            {
              role: 'user',
              content: `Analyze this transcribed voice call for social engineering, deepfakes, extortion, urgency, and financial fraud.
Transcript: """${transcript}"""
Return strict JSON with keys: fraud_score (0-100), risk_level ("safe"|"suspicious"|"scam"), confidence, reasons, analysis, attack_intent, reasonCodes`,
            },
          ],
        }),
      })

      if (!response.ok) continue
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) continue
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed.fraud_score !== 'undefined') {
        const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
        const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score)

        return {
          transcript,
          fraud_score: score,
          risk_level: risk,
          confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((r) => String(r)) : [],
          analysis: String(parsed.analysis || parsed.ai_analysis || ''),
          ai_analysis: String(parsed.ai_analysis || parsed.analysis || ''),
          attack_intent: String(parsed.attack_intent || inferAttackerIntent(transcript, '', risk)),
          threat_reconstruction: reconstructAttackChain(transcript, '', risk),
          reasonCodes: filterValidReasonCodes(parsed.reasonCodes || []),
          source: 'groq-whisper',
        }
      }
    } catch {
      continue
    }
  }
  return null
}

async function postAnalyze(type, payload) {
  // 1. Try server endpoints first (for web deployments with serverless backend)
  const endpoints = ['/api/analyze']
  if (typeof window !== 'undefined') {
    const customUrl = import.meta.env?.VITE_API_URL
    if (customUrl) endpoints.push(customUrl)
    if (window.location?.origin) {
      endpoints.push(`${window.location.origin}/api/analyze`)
    }
    endpoints.push('https://trust-break-ai.vercel.app/api/analyze')
    endpoints.push('https://trustbreak-app.vercel.app/api/analyze')
  }

  const reqHeaders = { 'Content-Type': 'application/json' }
  const groqKey = getGroqKey()
  const geminiKey = getGeminiKey()
  if (groqKey) reqHeaders['x-groq-api-key'] = groqKey
  if (geminiKey) reqHeaders['x-gemini-api-key'] = geminiKey

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({ type, payload }),
      })

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        continue;
      }

      const text = await res.text();
      if (text.trim().startsWith('<')) {
        continue;
      }

      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && (parsed.fraud_score !== undefined || parsed.risk_level || parsed.source)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  // 2. Try direct client-side AI model request if API key is present
  try {
    if (type === 'screenshot') {
      const geminiResult = await analyzeWithClientGemini(payload)
      if (geminiResult) return geminiResult
    } else {
      const groqResult = await analyzeWithClientGroq(type, payload)
      if (groqResult) return groqResult
    }
  } catch {}

  // 3. Fallback to instant local deterministic heuristic engine
  if (type === 'message') return analyzeMessageContent(payload?.message || '')
  if (type === 'link') {
    return analyzeUrlContent(payload?.url || '', {
      page_title: payload?.title || payload?.page_title,
      page_text: payload?.page_text || payload?.content,
      domain_age_days: payload?.domain_age_days,
      community_reports: payload?.community_reports,
      known_malicious: payload?.known_malicious,
    })
  }
  if (type === 'report') return analyzeScamReportContent(payload || {})
  if (type === 'screenshot') {
    return analyzeScreenshotFallback(payload?.detected_text || '', {
      reason: payload?.image_base64 || payload?.screenshot_url ? 'vision-call-failed' : 'no-image-payload',
    })
  }
  throw new Error('Analysis request failed')
}

export function analyzeMessage(message) {
  return postAnalyze('message', { message })
}

export function analyzeLink(url) {
  return postAnalyze('link', { url })
}

export async function investigateWebsite(url) {
  const endpoints = ['/api/tinyfish/investigate']
  if (typeof window !== 'undefined') {
    const customUrl = import.meta.env?.VITE_API_URL
    if (customUrl) endpoints.push(`${customUrl}/api/tinyfish/investigate`)
    if (window.location?.origin) {
      endpoints.push(`${window.location.origin}/api/tinyfish/investigate`)
    }
    endpoints.push('https://trust-break-ai.vercel.app/api/tinyfish/investigate')
    endpoints.push('https://trustbreak-app.vercel.app/api/tinyfish/investigate')
  }

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) continue

      const data = await res.json()
      if (data && (data.tinyfishInvestigation || data.status === 'error' || data.fraud_score !== undefined)) {
        return data
      }
    } catch {
      continue
    }
  }

  // Fallback if backend server endpoint is unreachable
  const heuristic = analyzeUrlContent(url || '')
  return {
    ...heuristic,
    source: 'offline-heuristic',
    tinyfishInvestigation: {
      url: url || '',
      status: 'failed',
      errorCode: 'OFFLINE_FALLBACK',
      message: 'Server endpoint unreachable. Fallback to local heuristic engine.',
      observations: [],
      riskIndicators: [],
      limitations: ['Network unreachable for live browser automation.'],
    },
  }
}

export function analyzeReport(payload) {
  return postAnalyze('report', payload)
}

// Longest edge used when downscaling an upload before it is sent to the vision
// engine. Keeps the JSON body well inside serverless request limits (a 10MB PNG
// becomes a ~250KB JPEG) and cuts round-trip time without hurting OCR accuracy.
const VISION_MAX_EDGE = 1280
const VISION_JPEG_QUALITY = 0.82

async function imageToVisionBase64(file) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error('Image preprocessing is not available in this environment')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Selected image could not be decoded'))
      el.src = objectUrl
    })

    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    const longest = Math.max(width, height) || 1
    const scale = longest > VISION_MAX_EDGE ? VISION_MAX_EDGE / longest : 1

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is unavailable for image preprocessing')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', VISION_JPEG_QUALITY)
    const base64 = dataUrl.split(',')[1] || ''
    if (!base64) throw new Error('Image encoding failed')

    return { image_base64: base64, mime_type: 'image/jpeg' }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Normalizes whatever the caller has (File/Blob, data URL, raw base64, remote
 * URL, or a ready-made payload) into the shape /api/analyze expects.
 */
async function toScreenshotPayload(input) {
  if (!input) return {}

  if (typeof input === 'string') {
    const value = input.trim()
    if (!value) return {}
    if (value.startsWith('data:')) {
      const [meta, data] = value.split(',')
      return {
        image_base64: data || '',
        mime_type: meta?.match(/data:([^;]+)/)?.[1] || 'image/png',
      }
    }
    if (/^https?:\/\//i.test(value)) return { screenshot_url: value }
    return { image_base64: value, mime_type: 'image/png' }
  }

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return imageToVisionBase64(input)
  }

  if (typeof input === 'object') {
    if (input.image_base64) {
      return { image_base64: input.image_base64, mime_type: input.mime_type || 'image/png' }
    }
    if (input.screenshot_url) {
      return { screenshot_url: input.screenshot_url, mime_type: input.mime_type }
    }
    if (input.detected_text) {
      return { detected_text: input.detected_text }
    }
  }

  return {}
}

/**
 * Analyze a screenshot with the vision engine.
 *
 * Accepts a File/Blob (what the uploader gives us), a data URL, base64, or a
 * remote URL. The image is genuinely serialized into the request body — the old
 * implementation passed the File object straight to JSON.stringify(), which
 * produced `{}` so the server never received any image and every scan fell back
 * to the same hardcoded score.
 */
export async function analyzeScreenshot(input = null) {
  let payload = {}
  try {
    payload = await toScreenshotPayload(input)
  } catch (err) {
    console.warn('Screenshot preprocessing failed:', err?.message)
    payload = {}
  }

  const serverResult = await postAnalyze('screenshot', payload)
  const unverified =
    serverResult?.unverified === true || serverResult?.analysis_status === 'vision_unavailable'

  if (!unverified) return serverResult

  // The server could not run vision (no key, bad key, timeout, 4xx...). If this
  // browser holds a Gemini key (Settings → AI Keys), try Gemini directly before
  // giving up — this is what keeps the scanner working when server env vars are
  // missing or misconfigured.
  const clientDiag = { attempted: false, attempts: [] }
  const clientResult = payload?.image_base64
    ? await analyzeWithClientGemini(payload, clientDiag)
    : null

  if (clientResult) {
    return {
      ...clientResult,
      degraded: false,
      vision_diagnostics: {
        ...(serverResult?.vision_diagnostics || {}),
        serverDegradedReason: serverResult?.degraded_reason || null,
        clientRetry: clientDiag,
      },
    }
  }

  return {
    ...serverResult,
    vision_diagnostics: {
      ...(serverResult?.vision_diagnostics || {}),
      clientRetry: clientDiag,
    },
  }
}

export async function analyzeVoice(payload = {}) {
  // 1. Try server endpoints (/api/analyze-voice)
  const endpoints = ['/api/analyze-voice']
  if (typeof window !== 'undefined') {
    const customUrl = import.meta.env?.VITE_API_URL
    if (customUrl) endpoints.push(`${customUrl}/api/analyze-voice`)
    if (window.location?.origin) {
      endpoints.push(`${window.location.origin}/api/analyze-voice`)
    }
    endpoints.push('https://trust-break-ai.vercel.app/api/analyze-voice')
    endpoints.push('https://trustbreak-app.vercel.app/api/analyze-voice')
  }

  const reqHeaders = { 'Content-Type': 'application/json' }
  const groqKey = getGroqKey()
  const geminiKey = getGeminiKey()
  if (groqKey) reqHeaders['x-groq-api-key'] = groqKey
  if (geminiKey) reqHeaders['x-gemini-api-key'] = geminiKey

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(payload),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!res.ok || !contentType.includes('application/json')) continue

      const text = await res.text()
      if (text.trim().startsWith('<')) continue

      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && (parsed.fraud_score !== undefined || parsed.risk_level || parsed.source)) {
        return parsed
      }
    } catch {
      continue
    }
  }

  // 2. Try direct client-side AI models (Gemini Audio / Groq Whisper + Llama)
  try {
    const geminiResult = await analyzeVoiceWithClientGemini(payload)
    if (geminiResult) return geminiResult

    const groqResult = await analyzeVoiceWithClientGroq(payload)
    if (groqResult) return groqResult
  } catch {}

  // 3. Fallback to local heuristic
  const textContent = payload.transcript_text || 'Voice recording stream'
  const fallback = analyzeMessageContent(textContent)
  return {
    ...fallback,
    transcript: textContent,
    source: 'offline-heuristic',
  }
}

export function extractUrlFromText(text) {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/https?:\/\/[^\s"'<>]+/i) || text.match(/\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|in|online|site|tech|xyz|co|app|live|bi)(?:\/[^\s"'<>]*)?/i)
  if (!match) return null
  let found = match[0].trim()
  found = found.replace(/[.,;)]+$/, '')
  if (!/^https?:\/\//i.test(found)) {
    found = `https://${found}`
  }
  return found
}


