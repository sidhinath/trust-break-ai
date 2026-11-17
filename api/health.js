import { getGroqConfigurationStatus, getGeminiConfigurationStatus } from './analyze.js'

export default async function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  const groq = getGroqConfigurationStatus()
  const gemini = getGeminiConfigurationStatus()

  res.status(200).json({
    ok: true,
    service: 'trustbreak-api',
    timestamp: new Date().toISOString(),
    // Boolean readiness only — never the key itself. Use this to diagnose why
    // /api/analyze falls back to heuristics ("AI unavailable").
    ai: {
      groq: groq.configured ? 'configured' : `missing (${groq.source} ${groq.problem})`,
      gemini: gemini.configured ? 'configured' : `missing (${gemini.source} ${gemini.problem})`,
      textAnalysisEngine: groq.configured ? 'groq' : 'heuristic-fallback',
    },
  })
}
