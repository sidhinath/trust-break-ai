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
    keyShape: resolved.shape,
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

  const probeResult = {
    workingModel: firstSuccess,
    totalDurationMs: Date.now() - startedAt,
    attempts,
  }

  let hint
  if (firstSuccess) {
    hint = `Vision engine is working (${firstSuccess}).`
  } else {
    const firstError = attempts.find((a) => a.error)?.error || ''
    if (/API key not valid|API_KEY_INVALID/i.test(firstError)) {
      hint = `Google rejected the key (${report.keyShape}). Create/copy a key from Google AI Studio (aistudio.google.com/apikey) — it should start with "AIza" or "AQ." — then update GEMINI_API_KEY and redeploy.`
    } else if (/has not been used in project|SERVICE_DISABLED/i.test(firstError)) {
      hint = 'The key is valid but the Generative Language API is disabled for its project. Enable it at console.cloud.google.com → APIs & Services → Enable APIs → "Generative Language API".'
    } else if (/referer|referrer|PERMISSION_DENIED/i.test(firstError)) {
      hint = 'The key is restricted (HTTP referrer/IP restriction) and cannot be used from the server. Create an unrestricted server key, or one restricted to the Generative Language API only.'
    } else if (/quota|RESOURCE_EXHAUSTED|429/i.test(firstError)) {
      hint = 'The key hit its quota. Wait for the quota window to reset or use a different project/key.'
    } else {
      hint = 'No model answered successfully — read probe.attempts[].error for the exact reason.'
    }
  }

  res.status(200).json({
    ...report,
    ok: Boolean(firstSuccess),
    hint,
    probe: probeResult,
  })
}
