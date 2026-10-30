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

function getGroqKey() {
  let key = ''
  try {
    key = localStorage.getItem('ghostnet_groq_api_key') || import.meta.env?.VITE_GROQ_API_KEY || import.meta.env?.GROQ_API_KEY || ''
  } catch {
    key = import.meta.env?.VITE_GROQ_API_KEY || import.meta.env?.GROQ_API_KEY || ''
  }
  if (!key || typeof key !== 'string' || key.includes('placeholder') || key.includes('your_groq')) return ''
  return key.trim()
}

function getGeminiKey() {
  let key = ''
  try {
    key = localStorage.getItem('ghostnet_gemini_api_key') || import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY || ''
  } catch {
    key = import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY || ''
  }
  if (!key || typeof key !== 'string' || key.includes('placeholder') || key.includes('your_gemini')) return ''
  return key.trim()
}

async function analyzeWithClientGroq(type, payload) {
  const apiKey = getGroqKey()
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
- reasonCodes (array of string codes: URGENCY_LANGUAGE, IMPERSONATES_BRAND, REQUESTS_OTP, LOOKALIKE_DOMAIN, REQUESTS_PAYMENT)`
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
            { role: 'system', content: 'You are GhostNet AI. Respond in strict JSON only.' },
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

async function analyzeWithClientGemini(payload) {
  const apiKey = getGeminiKey()
  if (!apiKey || !payload?.image_base64) return null

  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
  const prompt = `Analyze this screenshot for cyber scam, phishing, brand impersonation, urgency manipulation, payment fraud, QR code traps, or social engineering.
Return strict JSON only with keys:
- fraud_score (number 0-100)
- risk_level (safe|suspicious|scam)
- confidence (low|medium|high)
- reasons (array of specific visual and textual evidence strings)
- analysis (professional summary of the visual threat)
- detected_text (all OCR extracted text from the image)
- attack_intent (what the fraudster is attempting to achieve)
- reasonCodes (array of string codes)`

  for (const model of models) {
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
                      mime_type: payload.mime_type || 'image/png',
                      data: payload.image_base64,
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
      if (!text) continue
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed.fraud_score !== 'undefined') {
        const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
        const risk = ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score)

        return {
          fraud_score: score,
          risk_level: risk,
          confidence: parsed.confidence || (score > 70 ? 'high' : 'medium'),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((r) => String(r)) : [],
          analysis: String(parsed.analysis || parsed.ai_analysis || ''),
          ai_analysis: String(parsed.ai_analysis || parsed.analysis || ''),
          detected_text: String(parsed.detected_text || ''),
          attack_intent: String(parsed.attack_intent || inferAttackerIntent(parsed.detected_text || '', '', risk)),
          threat_reconstruction: reconstructAttackChain(parsed.detected_text || 'Screenshot image analysis', '', risk),
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

async function analyzeVoiceWithClientGemini(payload) {
  const apiKey = getGeminiKey()
  if (!apiKey) return null

  const prompt = `You are GhostNet AI, an elite voice call scam, deepfake, voice cloning, and social engineering threat detector.
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
            { role: 'system', content: 'You are GhostNet AI voice detector. Respond in strict JSON only.' },
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
    endpoints.push('https://ghost-net-zeta.vercel.app/api/analyze')
    endpoints.push('https://ghostnet-app.vercel.app/api/analyze')
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
  if (type === 'link') return analyzeUrlContent(payload?.url || '')
  if (type === 'report') return analyzeScamReportContent(payload || {})
  if (type === 'screenshot') return analyzeScreenshotFallback(payload?.detected_text || '')
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
    endpoints.push('https://ghost-net-zeta.vercel.app/api/tinyfish/investigate')
    endpoints.push('https://ghostnet-app.vercel.app/api/tinyfish/investigate')
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

export function analyzeScreenshot(payload = {}) {
  return postAnalyze('screenshot', payload)
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
    endpoints.push('https://ghost-net-zeta.vercel.app/api/analyze-voice')
    endpoints.push('https://ghostnet-app.vercel.app/api/analyze-voice')
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
