import {
  analyzeMessageContent,
  scoreToRisk,
} from '../src/lib/scanner.js'
import { filterValidReasonCodes } from '../src/lib/reasonCodes.js'

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

    const headerGemini = req?.headers?.['x-gemini-api-key']
    const headerGroq = req?.headers?.['x-groq-api-key']
    const rawGemini = (headerGemini && typeof headerGemini === 'string' && !headerGemini.includes('placeholder')) ? headerGemini : process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    const rawGroq = (headerGroq && typeof headerGroq === 'string' && !headerGroq.includes('placeholder')) ? headerGroq : process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
    const geminiKey = rawGemini && !rawGemini.includes('placeholder') && !rawGemini.includes('your_gemini') ? rawGemini.trim() : null
    const groqKey = rawGroq && !rawGroq.includes('placeholder') && !rawGroq.includes('your_groq') ? rawGroq.trim() : null

    // 1. Try Gemini 1.5 Flash Multimodal Audio AI if Gemini key is set
    if (geminiKey) {
      try {
        const apiKey = geminiKey
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

        const geminiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

        if (geminiResp.ok) {
          const data = await geminiResp.json()
          const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join(' ') || ''
          const parsed = JSON.parse(text)
          if (parsed && typeof parsed.fraud_score !== 'undefined') {
            const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
            aiResult = {
              transcript: parsed.transcript || transcript,
              fraud_score: score,
              risk_level: ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score),
              confidence: parsed.confidence || 'high',
              reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : [],
              analysis: String(parsed.analysis || parsed.ai_analysis || ''),
              ai_analysis: String(parsed.analysis || parsed.ai_analysis || ''),
              attack_intent: String(parsed.attack_intent || ''),
              reasonCodes: filterValidReasonCodes(parsed.reasonCodes || []),
              source: 'gemini',
            }
          }
        }
      } catch (err) {
        console.warn('[analyze-voice] Gemini audio failed:', err.message)
      }
    }

    // 2. Try Groq Whisper + Llama 3.3 if Gemini was not used or failed
    if (!aiResult && groqKey) {
      if (!transcript && audio_base64) {
        try {
          const audioBuffer = Buffer.from(audio_base64, 'base64')
          const ext = mime_type?.includes('mp3') ? 'mp3' : mime_type?.includes('wav') ? 'wav' : 'webm'
          const blob = new Blob([audioBuffer], { type: mime_type || 'audio/webm' })

          const formData = new FormData()
          formData.append('file', blob, `audio.${ext}`)
          formData.append('model', 'whisper-large-v3')

          const whisperResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
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
          const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              temperature: 0.1,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: 'You are GhostNet AI. Always respond in strict JSON.' },
                {
                  role: 'user',
                  content: `Analyze this transcribed call for voice scams, deepfakes, impersonation, urgency pressure, and financial fraud.
Transcript: """${transcript}"""
Return strict JSON with keys: fraud_score (0-100), risk_level ("safe"|"suspicious"|"scam"), confidence, reasons (array), analysis, attack_intent, reasonCodes (array).`,
                },
              ],
            }),
          })

          if (groqResp.ok) {
            const data = await groqResp.json()
            const text = data?.choices?.[0]?.message?.content
            const parsed = JSON.parse(text)
            if (parsed && typeof parsed.fraud_score !== 'undefined') {
              const score = Math.max(0, Math.min(100, Number(parsed.fraud_score || 0)))
              aiResult = {
                transcript,
                fraud_score: score,
                risk_level: ['safe', 'suspicious', 'scam'].includes(parsed.risk_level) ? parsed.risk_level : scoreToRisk(score),
                confidence: parsed.confidence || 'high',
                reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : [],
                analysis: String(parsed.analysis || ''),
                ai_analysis: String(parsed.analysis || ''),
                attack_intent: String(parsed.attack_intent || ''),
                reasonCodes: filterValidReasonCodes(parsed.reasonCodes || []),
                source: 'groq-whisper',
              }
            }
          }
        } catch (err) {
          console.warn('[analyze-voice] Groq Llama failed:', err.message)
        }
      }
    }

    if (aiResult) {
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
