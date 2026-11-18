import {
  GEMINI_KEY_ENV_NAMES,
  VISION_MODELS,
  extractGeminiText,
  keyFingerprint,
  resolveGeminiKey,
} from '../src/lib/vision.js'

/**
 * GET /api/vision-health
 *
 * Diagnostic endpoint for the vision pipeline. It never uploads or stores an
 * image. Use it to answer "why is vision unavailable?" in production.
 *
 *   GET /api/vision-health          -> key detection + model chain
 *   GET /api/vision-health?probe=1  -> also sends a tiny text-only prompt to the
 *                                      first model and returns Google's exact
 *                                      HTTP status / error message.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const headerKey = req.headers?.['x-gemini-api-key']
  const resolved = resolveGeminiKey({ headerKey, env: process.env })

  const report = {
    configured: Boolean(resolved.key),
    keySource: resolved.source,
    keyFingerprint: keyFingerprint(resolved.key),
    keyWasCleaned: Boolean(resolved.cleaned),
    checkedSources: resolved.checked,
    envNamesAccepted: [...GEMINI_KEY_ENV_NAMES],
    models: [...VISION_MODELS],
    runtime: {
      node: process.version,
      vercelEnv: process.env.VERCEL_ENV || null,
      region: process.env.VERCEL_REGION || null,
    },
  }

  if (!resolved.key) {
    // Distinguish "nobody set a key" from "a key is set but unusable" — the
    // second case used to look identical in the UI while the real problem was
    // a stray quote or newline in the pasted value.
    const rejected = resolved.checked.filter(
      (entry) =>
        entry.source !== 'x-gemini-api-key header' &&
        entry.status &&
        entry.status !== 'ok' &&
        entry.status !== 'is not set'
    )

    res.status(200).json({
      ...report,
      ok: false,
      hint: rejected.length
        ? `${rejected[0].source} is set but unusable (${rejected[0].status}). Re-save that variable in Vercel with the raw key only — no quotes, no "KEY=", no spaces or line breaks — then Redeploy.`
        : 'No usable Gemini key found. Set GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables (Production), then Redeploy. Or paste a key in the app under Security & Settings → AI Keys.',
    })
    return
  }

  const wantsProbe = req.query?.probe === '1' || req.query?.probe === 'true'
  if (!wantsProbe) {
    res.status(200).json({
      ...report,
      ok: true,
      hint: 'Key detected. Call /api/vision-health?probe=1 to test the model chain.',
    })
    return
  }

  const startedAt = Date.now()
  const attempts = []
  let firstSuccess = null

  for (const model of VISION_MODELS) {
    const modelStartedAt = Date.now()
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': resolved.key,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: ok' }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 8 },
          }),
        }
      )

      const raw = await response.text()
      let body = null
      try {
        body = JSON.parse(raw)
      } catch {
        body = { raw: raw.slice(0, 400) }
      }

      const attempt = {
        model,
        status: response.status,
        durationMs: Date.now() - modelStartedAt,
      }

      if (response.ok) {
        attempt.text = extractGeminiText(body).slice(0, 80)
        attempts.push(attempt)
        firstSuccess = model
        break
      }

      attempt.error = body?.error?.message || raw.slice(0, 400)
      attempts.push(attempt)
    } catch (err) {
      attempts.push({
        model,
        status: null,
        durationMs: Date.now() - modelStartedAt,
        error: err?.message || 'probe request failed',
      })
    }
  }

  res.status(200).json({
    ...report,
    ok: Boolean(firstSuccess),
    probe: {
      workingModel: firstSuccess,
      totalDurationMs: Date.now() - startedAt,
      attempts,
    },
  })
}
