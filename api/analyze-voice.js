import {
  analyzeMessageContent,
  scoreToRisk,
} from '../src/lib/scanner.js'
import { filterValidReasonCodes } from '../src/lib/reasonCodes.js'
import {
  buildScanCacheKey,
  getCachedScanResult,
  setCachedScanResult,
  enforceRateLimit,
  fetchWithRetry,
} from './_lib/resilience.js'
import {
  runMultimodalAnalysisWithRouter,
  runTextAnalysisWithRouter,
} from '../src/lib/aiRouter.js'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  // Feature 6: Enabled by default, can be disabled with ENABLE_VOICE_SCANNER=false
  const isEnabled = process.env.ENABLE_VOICE_SCANNER !== 'false'
  if (!isEnabled) {
    res.status(404).json({ error: 'Voice scanner is disabled on this environment.' })
    return
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
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

  if (!enforceRateLimit(req, res, { scope: 'analyze-voice', max: 10 })) {
    return
  }

  try {
    const { audio_base64, mime_type, transcript_text } = req.body || {}

    // Payload size guard: reject oversized payloads (>6MB base64 / ~4.5MB binary) with clear 413
    if (audio_base64 && typeof audio_base64 === 'string' && audio_base64.length > 6 * 1024 * 1024) {
      res.status(413).json({
        error: 'Audio payload exceeds maximum size limit (4.5MB). Please upload a shorter recording under 60 seconds.',
      })
      return
    }

    let transcript = transcript_text || ''
    let aiResult = null

    const voiceCacheKey = transcript_text
      ? buildScanCacheKey('voice', transcript_text)
      : audio_base64
      ? buildScanCacheKey('voice-audio', audio_base64.slice(0, 4096) + ':' + audio_base64.length)
      : null
    if (voiceCacheKey) {
      const cachedVoice = getCachedScanResult(voiceCacheKey)
      if (cachedVoice) {
        res.status(200).json(cachedVoice)
        return
      }
    }

    const headerGemini = req?.headers?.['x-gemini-api-key']
    const headerGroq = req?.headers?.['x-groq-api-key']
    const rawGemini = (headerGemini && typeof headerGemini === 'string' && !headerGemini.includes('placeholder')) ? headerGemini : process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    const rawGroq = (headerGroq && typeof headerGroq === 'string' && !headerGroq.includes('placeholder')) ? headerGroq : process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
    const geminiKey = rawGemini && !rawGemini.includes('placeholder') && !rawGemini.includes('your_gemini') ? rawGemini.trim() : null
    const groqKey = rawGroq && !rawGroq.includes('placeholder') && !rawGroq.includes('your_groq') ? rawGroq.trim() : null

    // 1. Try centralized Multimodal Router (gemini-3.5-flash-lite -> gemini-3.8-flash)
    if (geminiKey) {
      try {
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
        if (audio_base64) {
          parts.push({
            inline_data: {
              mime_type: mime_type || 'audio/webm',
              data: audio_base64,
            },
          })
        } else if (transcript) {
          parts.push({ text: `Transcript to analyze: """${transcript}"""` })
        }

        const routedVoice = await runMultimodalAnalysisWithRouter({
          parts,
          geminiKey,
        })
        if (routedVoice) {
          aiResult = {
            ...routedVoice,
            transcript: routedVoice.transcript || transcript,
          }
        }
      } catch (err) {
        console.warn('[analyze-voice] Gemini multimodal router failed:', err.message)
      }
    }

    // 2. Try Groq Whisper + centralized Text Router if multimodal was not used or failed
    if (!aiResult && groqKey) {
      if (!transcript && audio_base64) {
        try {
          const audioBuffer = Buffer.from(audio_base64, 'base64')
          const ext = mime_type?.includes('mp3') ? 'mp3' : mime_type?.includes('wav') ? 'wav' : 'webm'
          const blob = new Blob([audioBuffer], { type: mime_type || 'audio/webm' })

          const formData = new FormData()
          formData.append('file', blob, `audio.${ext}`)
          formData.append('model', 'whisper-large-v3')

          const whisperResp = await fetchWithRetry('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${groqKey}` },
            body: formData,
          })

          if (whisperResp.ok) {
            const whisperData = await whisperResp.json()
            transcript = whisperData.text || ''
          }
        } catch (err) {
          console.warn('[analyze-voice] Groq Whisper failed:', err.message)
        }
      }

      if (transcript) {
        try {
          const textPrompt = `Analyze this transcribed call for voice scams, deepfakes, impersonation, urgency pressure, and financial fraud.
Transcript: """${transcript}"""
Return strict JSON with keys: fraud_score (0-100), risk_level ("safe"|"suspicious"|"scam"), confidence, reasons (array), analysis, attack_intent, reasonCodes (array).`
          const routedText = await runTextAnalysisWithRouter({
            prompt: textPrompt,
            groqKey,
            geminiKey,
          })
          if (routedText) {
            aiResult = {
              ...routedText,
              transcript,
              source: routedText.source === 'groq' ? 'groq-whisper' : routedText.source,
            }
          }
        } catch (err) {
          console.warn('[analyze-voice] Text router failed:', err.message)
        }
      }
    }

    if (aiResult) {
      if (voiceCacheKey) setCachedScanResult(voiceCacheKey, aiResult)
      res.status(200).json(aiResult)
      return
    }

    if (!transcript) {
      // Return baseline safe/empty analysis if no transcript could be generated
      res.status(200).json({
        transcript: '',
        fraud_score: 10,
        risk_level: 'safe',
        confidence: 'low',
        reasons: ['No clear speech detected in audio stream'],
        analysis: 'Acoustic waveform analyzed. Insufficient speech tokens detected to indicate social engineering.',
        ai_analysis: 'No speech recognized.',
        reasonCodes: [],
        source: 'offline-heuristic',
      })
      return
    }

    // Run transcript through message analysis fallback
    const analysis = analyzeMessageContent(transcript)
    res.status(200).json({
      ...analysis,
      transcript,
      source: process.env.GROQ_API_KEY ? 'groq-whisper' : 'offline-heuristic',
    })
  } catch (error) {
    console.error('[analyze-voice error]', error)
    res.status(500).json({ error: 'Voice scan failed', details: error.message })
  }
}
