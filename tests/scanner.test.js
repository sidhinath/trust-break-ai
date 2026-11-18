import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  extractAttackSignals,
  reconstructAttackChain,
  inferAttackerIntent,
  findSimilarScams,
  analyzeMessageContent,
  analyzeUrlContent,
  analyzeScreenshotFallback,
  analyzePageContext,
  scoreToRisk,
  scoreToBand,
  RISK_BANDS,
} from '../src/lib/scanner.js'
import { SAMPLE_THREATS } from '../src/lib/threatLibrary.js'
import { filterValidReasonCodes, VALID_REASON_CODES } from '../src/lib/reasonCodes.js'

describe('TrustBreak AI Scanner Engine Tests', () => {
  it('should extract social engineering signals from an urgent KYC SMS', () => {
    const text = 'URGENT: Your SBI bank account will be suspended within 24 hours. Update KYC at http://fake-sbi.top'
    const signals = extractAttackSignals(text)
    
    assert.ok(signals.urgency, 'Expected urgency signal to be detected')
    assert.ok(signals.credential, 'Expected credential harvesting signal to be detected')
    assert.ok(signals.impersonation, 'Expected SBI impersonation to be detected')
  })

  it('should reconstruct a 5-stage attack chain for scam messages', () => {
    const text = 'Dear Customer, your electricity will be disconnected tonight at 9:30 PM due to unpaid bill.'
    const chain = reconstructAttackChain(text, '', 'scam')
    
    assert.strictEqual(chain.length, 5, 'Expected 5-stage kill chain')
    assert.strictEqual(chain[0].stage, '1. Ingress & Contact')
    assert.strictEqual(chain[4].stage, '5. Impact & Loss')
  })

  it('should infer clear plain-English attacker intent for UPI scam', () => {
    const text = 'You won Rs. 5000 cashback! Enter UPI PIN to receive money in your Google Pay account.'
    const intent = inferAttackerIntent(text, '', 'scam')
    
    assert.ok(intent.toLowerCase().includes('upi') || intent.toLowerCase().includes('fund') || intent.toLowerCase().includes('pin'), 'Expected intent to capture UPI PIN deception')
  })

  it('should identify similar scam patterns from the threat benchmark library', () => {
    const text = 'Electricity power cut tonight if bill is not updated immediately call 9876543210'
    const matches = findSimilarScams(text)
    
    assert.ok(Array.isArray(matches), 'Expected matches array')
    assert.ok(matches.length > 0, 'Expected at least one similar match')
  })

  it('should flag lookalike domains and typosquatting in URL analysis', () => {
    const url = 'https://sbi-kyc-verification-portal.online/login'
    const result = analyzeUrlContent(url)
    
    assert.strictEqual(result.risk_level, 'scam', 'Expected scam risk level')
    assert.ok(result.fraud_score >= 70, 'Expected high fraud score')
    assert.ok(result.simulation_steps.length > 0, 'Expected educational simulation steps')
    assert.strictEqual(result.simulation_steps[0].safe, false, 'Expected threat simulation step')
  })

  it('should generate safe security walkthrough steps for legitimate URLs', () => {
    const url = 'https://www.google.com/'
    const result = analyzeUrlContent(url)

    assert.strictEqual(result.risk_level, 'safe', 'Expected safe risk level for google.com')
    assert.ok(result.fraud_score < 30, 'Expected low fraud score')
    assert.ok(result.simulation_steps.length > 0, 'Expected walkthrough steps')
    assert.strictEqual(result.simulation_steps[0].safe, true, 'Expected safe walkthrough step')
  })

  it('should safely identify clean legitimate messages', () => {
    const text = 'Hey, are we still meeting for lunch tomorrow at 1 PM?'
    const result = analyzeMessageContent(text)
    
    assert.strictEqual(result.risk_level, 'safe', 'Expected safe risk level')
    assert.ok(result.fraud_score < 30, 'Expected low fraud score')
  })

  it('should verify the threat library has valid benchmark scenarios', () => {
    assert.ok(SAMPLE_THREATS.length >= 6, 'Expected at least 6 benchmark threats')
    for (const threat of SAMPLE_THREATS) {
      assert.ok(threat.id, 'Threat must have id')
      assert.ok(threat.title, 'Threat must have title')
      assert.ok(threat.category, 'Threat must have category')
      assert.ok(threat.sampleInput, 'Threat must have sample input')
    }
  })
})

// ============================================================
// Feature 1 — Reason Code Filtering
// ============================================================
describe('Feature 1 — Reason Code Filtering', () => {
  it('should pass all 12 known reason codes through the filter', () => {
    const allCodes = [...VALID_REASON_CODES]
    assert.strictEqual(allCodes.length, 12, 'Expected exactly 12 valid reason codes')
    const filtered = filterValidReasonCodes(allCodes)
    assert.strictEqual(filtered.length, 12, 'All valid codes should pass through')
    assert.ok(filtered.includes('FAMILY_IMPERSONATION_RISK'), 'Expected FAMILY_IMPERSONATION_RISK in valid codes')
    assert.ok(filtered.includes('SECURITY_TEST_PAGE'), 'Expected SECURITY_TEST_PAGE in valid codes')
  })

  it('should filter out unknown / hallucinated reason codes', () => {
    const mixed = ['URGENCY_LANGUAGE', 'FAKE_CODE_XYZ', 'REQUESTS_OTP', 'HALLUCINATED_CODE', 'FAMILY_IMPERSONATION_RISK']
    const filtered = filterValidReasonCodes(mixed)
    assert.strictEqual(filtered.length, 3, 'Only 3 known codes should survive')
    assert.ok(filtered.includes('URGENCY_LANGUAGE'))
    assert.ok(filtered.includes('REQUESTS_OTP'))
    assert.ok(filtered.includes('FAMILY_IMPERSONATION_RISK'))
    assert.ok(!filtered.includes('FAKE_CODE_XYZ'))
  })

  it('should return empty array for null / undefined / non-array input', () => {
    assert.deepStrictEqual(filterValidReasonCodes(null), [])
    assert.deepStrictEqual(filterValidReasonCodes(undefined), [])
    assert.deepStrictEqual(filterValidReasonCodes('not-array'), [])
    assert.deepStrictEqual(filterValidReasonCodes(42), [])
  })

  it('should return empty array for empty array input', () => {
    assert.deepStrictEqual(filterValidReasonCodes([]), [])
  })
})

// ============================================================
// Feature 2 — Extended Heuristic Patterns
// ============================================================
describe('Feature 2 — Extended Heuristic Patterns', () => {
  it('should flag IP-literal URLs as high risk', () => {
    const result = analyzeUrlContent('http://192.168.1.1/login')
    assert.ok(result.fraud_score >= 60, `Expected high fraud score for IP URL, got ${result.fraud_score}`)
  })

  it('should detect "verification code" as OTP-related keyword', () => {
    const result = analyzeMessageContent('Your verification code is 123456. Do not share it with anyone.')
    assert.ok(result.fraud_score >= 20, `Expected elevated score for OTP keyword, got ${result.fraud_score}`)
  })

  it('should detect "outstanding dues" as payment-related keyword', () => {
    const result = analyzeMessageContent('Your outstanding dues of Rs. 5000 must be cleared immediately.')
    assert.ok(result.fraud_score >= 20, `Expected elevated score for payment keyword, got ${result.fraud_score}`)
  })

  it('should flag additional URL shortener domains (ow.ly)', () => {
    const result = analyzeUrlContent('https://ow.ly/suspicious-redirect')
    assert.ok(result.fraud_score >= 40, `Expected elevated score for URL shortener, got ${result.fraud_score}`)
    assert.ok(result.reasons.some(r => r.toLowerCase().includes('shortening') || r.toLowerCase().includes('shortener')), 'Expected shortener warning in reasons')
  })
})

// ============================================================
// Feature 9 — Security test pages & honest scoring bands
// ============================================================
describe('Feature 9 — Security test pages & risk bands', () => {
  it('should map scores onto Safe 0-25 / Medium 26-60 / High 61-100', () => {
    assert.strictEqual(RISK_BANDS.safeMax, 25)
    assert.strictEqual(RISK_BANDS.mediumMax, 60)

    assert.strictEqual(scoreToBand(0), 'safe')
    assert.strictEqual(scoreToBand(25), 'safe')
    assert.strictEqual(scoreToBand(26), 'medium')
    assert.strictEqual(scoreToBand(60), 'medium')
    assert.strictEqual(scoreToBand(61), 'high')
    assert.strictEqual(scoreToBand(100), 'high')

    assert.strictEqual(scoreToRisk(25), 'safe')
    assert.strictEqual(scoreToRisk(26), 'suspicious')
    assert.strictEqual(scoreToRisk(60), 'suspicious')
    assert.strictEqual(scoreToRisk(61), 'scam')
  })

  it('should flag itisatrap.org as a security test page, never as safe', () => {
    const result = analyzeUrlContent('https://www.itisatrap.org/firefox/its-a-trap.html')

    assert.strictEqual(result.is_security_test_page, true, 'Expected security test page detection')
    assert.ok(result.fraud_score > RISK_BANDS.mediumMax, `Expected high risk, got ${result.fraud_score}`)
    assert.strictEqual(result.risk_level, 'scam')
    assert.ok(result.reasonCodes.includes('SECURITY_TEST_PAGE'), 'Expected SECURITY_TEST_PAGE reason code')
    assert.ok(
      result.reasons.some((reason) => /security test page/i.test(reason)),
      'Expected a human-readable security-test-page reason'
    )
  })

  it('should flag testsafebrowsing.appspot.com/phishing as a security test page', () => {
    const result = analyzeUrlContent('https://testsafebrowsing.appspot.com/phishing')

    assert.strictEqual(result.is_security_test_page, true)
    assert.ok(result.fraud_score > RISK_BANDS.mediumMax, `Expected high risk, got ${result.fraud_score}`)
    assert.ok(result.reasonCodes.includes('SECURITY_TEST_PAGE'))
  })

  it('should never return 0/100 just because HTTPS is valid', () => {
    const result = analyzeUrlContent('https://random-unknown-domain-abc123.com/')

    assert.ok(result.fraud_score > 0, 'A bare HTTPS URL must not score a perfect zero')
    assert.ok(result.fraud_score <= RISK_BANDS.safeMax, 'An unknown but clean domain should stay in the safe band')
    assert.strictEqual(scoreToBand(result.fraud_score), 'safe')
  })

  it('should keep google.com in the safe band while still explaining the score', () => {
    const result = analyzeUrlContent('https://www.google.com/search?q=antigravity+ide')

    assert.strictEqual(result.risk_level, 'safe')
    assert.ok(result.fraud_score > 0 && result.fraud_score <= RISK_BANDS.safeMax)
    assert.ok(Array.isArray(result.score_breakdown) && result.score_breakdown.length > 0, 'Expected a score breakdown')
    assert.ok(result.reasons.length > 0, 'Expected explanatory reasons')
  })

  it('should penalise credential-harvesting cues in the page title and body', () => {
    const result = analyzeUrlContent('https://account-verify-secure.example/', {
      page_title: 'Sign in to your account',
      page_text: 'Your account has been suspended. Enter your password to verify your identity immediately.',
    })

    assert.strictEqual(result.page_context_used, true)
    assert.ok(result.fraud_score > RISK_BANDS.safeMax, `Expected elevated score, got ${result.fraud_score}`)
    assert.ok(
      result.reasons.some((reason) => /password|suspended|urgency|credential/i.test(reason)),
      'Expected page-content evidence in reasons'
    )
  })

  it('should score page context signals deterministically', () => {
    const clean = analyzePageContext({ title: 'Weekly newsletter', text: 'Here are this week\'s articles.' })
    assert.strictEqual(clean.points, 0)

    const phishing = analyzePageContext({
      title: 'Verify your account',
      text: 'Your account will be blocked. Enter your password and OTP immediately.',
    })
    assert.ok(phishing.points > 0)
    assert.ok(phishing.points <= 35, 'Page-context penalties must be capped')
  })
})

// ============================================================
// Feature 6 — Voice & Deepfake Spectral Features
// ============================================================
import { computeSpectralFlatness, combineVoiceThreatScore } from '../src/lib/spectralFeatures.js'

describe('Feature 6 — Voice Acoustic & Spectral Scoring', () => {
  it('should compute spectral flatness within valid bounds (0 to 1)', () => {
    // Generate 2048 samples of simulated tone (sine wave)
    const samples = new Float32Array(2048)
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / 44100)
    }
    const flatness = computeSpectralFlatness(samples)
    assert.ok(flatness >= 0 && flatness <= 1, `Flatness must be between 0 and 1, got ${flatness}`)
  })

  it('should return default baseline for empty / short audio', () => {
    assert.strictEqual(computeSpectralFlatness(null), 0.5)
    assert.strictEqual(computeSpectralFlatness(new Float32Array(100)), 0.5)
  })

  it('should combine text risk score with acoustic anomaly signal', () => {
    // High text risk with robotic compression (flatness = 0.05)
    const score = combineVoiceThreatScore(80, 0.05)
    assert.ok(score >= 70, `Expected high risk combined score, got ${score}`)

    // Low text risk with normal conversational audio (flatness = 0.35)
    const safeScore = combineVoiceThreatScore(10, 0.35)
    assert.ok(safeScore <= 30, `Expected low risk score for normal conversation, got ${safeScore}`)
  })
})

describe('Feature 1 & 2 — Deterministic Reason Code Inference', () => {
  it('should attach reasonCodes and source to analyzeMessageContent', () => {
    const text = 'URGENT: Your SBI account is blocked. Verify OTP immediately.'
    const result = analyzeMessageContent(text)
    assert.ok(Array.isArray(result.reasonCodes), 'Expected reasonCodes array')
    assert.ok(result.reasonCodes.length > 0, 'Expected at least one reason code')
    assert.ok(result.reasonCodes.includes('URGENCY_LANGUAGE'))
    assert.ok(result.reasonCodes.includes('REQUESTS_OTP'))
    assert.strictEqual(result.source, 'offline-heuristic')
  })

  it('should attach reasonCodes and source to analyzeUrlContent', () => {
    const url = 'https://sbi-kyc-verification-portal.online/login'
    const result = analyzeUrlContent(url)
    assert.ok(Array.isArray(result.reasonCodes), 'Expected reasonCodes array')
    assert.ok(result.reasonCodes.length > 0, 'Expected at least one reason code')
    assert.strictEqual(result.source, 'offline-heuristic')
  })
})

// ============================================================
// Audit Repairs — withTimeout & safeParseVerdict
// ============================================================
import {
  withTimeout,
  safeParseVerdict,
  hashDomain,
  extractDomain,
  supabaseFetchUpsert,
  getSupabaseReadClient,
  getSupabaseServiceClient,
} from '../api/analyze.js'
import syncFeedsHandler from '../api/cron/sync-feeds.js'
import analyzeHandler from '../api/analyze.js'
import visionHealthHandler from '../api/vision-health.js'
import { inspectKey, resolveGeminiKey, sanitizeKeyValue } from '../src/lib/vision.js'
import voiceHandler from '../api/analyze-voice.js'
import {
  analyzeMessage,
  analyzeLink,
  analyzeScreenshot,
  analyzeReport,
} from '../src/lib/api.js'

describe('Audit Repairs — withTimeout Helper', () => {
  it('should resolve normally when promise completes before timeout', async () => {
    const fastPromise = new Promise((resolve) => setTimeout(() => resolve('success'), 20))
    const result = await withTimeout(fastPromise, 200)
    assert.strictEqual(result, 'success')
  })

  it('should reject with timeout error when promise exceeds deadline', async () => {
    const slowPromise = new Promise((resolve) => setTimeout(() => resolve('too-slow'), 200))
    await assert.rejects(
      () => withTimeout(slowPromise, 30),
      /AI call timed out after 30ms/
    )
  })
})

describe('Audit Repairs — safeParseVerdict Parsing & Code Defense', () => {
  it('should parse clean JSON with valid reason codes and explanation', () => {
    const raw = JSON.stringify({
      reasonCodes: ['URGENCY_LANGUAGE', 'REQUESTS_OTP'],
      explanation: 'Urgent demand for OTP authentication.',
    })
    const verdict = safeParseVerdict(raw)
    assert.ok(verdict, 'Expected parsed verdict')
    assert.deepStrictEqual(verdict.reasonCodes, ['URGENCY_LANGUAGE', 'REQUESTS_OTP'])
    assert.strictEqual(verdict.explanation, 'Urgent demand for OTP authentication.')
  })

  it('should extract JSON from markdown code fences and filter invalid codes', () => {
    const text = 'Here is the analysis:\n```json\n{\n  "reasonCodes": ["IMPERSONATES_BRAND", "INVALID_HALLUCINATION"],\n  "explanation": "Fake portal mimicking SBI."\n}\n```'
    const verdict = safeParseVerdict(text)
    assert.ok(verdict, 'Expected parsed verdict')
    assert.deepStrictEqual(verdict.reasonCodes, ['IMPERSONATES_BRAND'])
    assert.strictEqual(verdict.explanation, 'Fake portal mimicking SBI.')
  })

  it('should return null for malformed or non-JSON input', () => {
    assert.strictEqual(safeParseVerdict(null), null)
    assert.strictEqual(safeParseVerdict(''), null)
    assert.strictEqual(safeParseVerdict('This is just plain text without any JSON structure'), null)
    assert.strictEqual(safeParseVerdict('{ broken json: true'), null)
  })
})

describe('Audit Repairs — Threat Feed & Domain Normalization', () => {
  it('should hash normalized domain with SHA-256 hex string', () => {
    const hash1 = hashDomain('Example.COM ')
    const hash2 = hashDomain('example.com')
    assert.strictEqual(hash1, hash2, 'Hash must be case- and whitespace-insensitive')
    assert.strictEqual(hash1.length, 64, 'SHA-256 hash must be 64 characters long')
  })

  it('should extract lowercase hostname from standard and malformed URLs', () => {
    assert.strictEqual(extractDomain('https://Phishing-Portal.Top/login?id=1'), 'phishing-portal.top')
    assert.strictEqual(extractDomain('http://sub.bank.example.co.in/path'), 'sub.bank.example.co.in')
    assert.strictEqual(extractDomain('not a url'), null)
  })
})

describe('Audit Repairs — PostgREST Upsert on_conflict Query Param', () => {
  it('should include on_conflict query string parameter when specified', async () => {
    let requestedUrl = ''
    let requestedHeaders = {}
    const originalFetch = globalThis.fetch

    globalThis.fetch = async (url, opts) => {
      requestedUrl = String(url)
      requestedHeaders = opts.headers
      return {
        ok: true,
        text: async () => '',
      }
    }

    try {
      await supabaseFetchUpsert(
        'https://test-project.supabase.co',
        'service-key-123',
        'threat_indicators',
        { indicator_hash: 'abc', risk_score: 80 },
        { onConflict: 'indicator_hash' }
      )

      assert.ok(
        requestedUrl.includes('on_conflict=indicator_hash'),
        `Expected URL to contain on_conflict=indicator_hash, got: ${requestedUrl}`
      )
      assert.strictEqual(
        requestedHeaders.Prefer,
        'resolution=merge-duplicates,return=minimal',
        'Expected resolution=merge-duplicates header'
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

describe('Audit Repairs — Supabase Read/Write Separation', () => {
  const origServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const origAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const origUrl = process.env.VITE_SUPABASE_URL

  it('should allow read client using anon key when service role key is absent', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key-abc'
    process.env.VITE_SUPABASE_URL = 'https://demo.supabase.co'

    const readClient = getSupabaseReadClient()
    const serviceClient = getSupabaseServiceClient()

    assert.ok(readClient, 'Read client should initialize with anon key')
    assert.strictEqual(serviceClient, null, 'Service client must return null without service role key')

    // Restore
    if (origServiceKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceKey
    if (origAnonKey) process.env.VITE_SUPABASE_ANON_KEY = origAnonKey
    if (origUrl) process.env.VITE_SUPABASE_URL = origUrl
  })
})

describe('Audit Repairs — Cron Endpoint Security', () => {
  function createMockRes() {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
        return this
      },
    }
    return res
  }

  const origSecret = process.env.CRON_SECRET

  it('should reject with 401 when CRON_SECRET is not configured on server', async () => {
    delete process.env.CRON_SECRET
    const req = { method: 'GET', headers: {} }
    const res = createMockRes()

    await syncFeedsHandler(req, res)

    assert.strictEqual(res.statusCode, 401)
    assert.ok(res.body.error.includes('CRON_SECRET is not configured'))
  })

  it('should reject with 401 when authorization token does not match CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'super-secret-cron-token'
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer wrong-token' },
    }
    const res = createMockRes()

    await syncFeedsHandler(req, res)

    assert.strictEqual(res.statusCode, 401)
    assert.strictEqual(res.body.error, 'Unauthorized')

    // Restore
    if (origSecret) process.env.CRON_SECRET = origSecret
    else delete process.env.CRON_SECRET
  })
})

describe('Audit Repairs — Voice Scanner API Failure Modes', () => {
  function createMockRes() {
    const res = {
      statusCode: 200,
      body: null,
      headers: {},
      setHeader(k, v) { this.headers[k] = v },
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
        return this
      },
    }
    return res
  }

  it('should return 404 when voice scanner feature flag is disabled', async () => {
    const origFlag = process.env.ENABLE_VOICE_SCANNER
    process.env.ENABLE_VOICE_SCANNER = 'false'
    const req = { method: 'POST', body: {} }
    const res = createMockRes()

    await voiceHandler(req, res)

    assert.strictEqual(res.statusCode, 404)
    assert.ok(res.body.error.includes('disabled'))

    if (origFlag !== undefined) process.env.ENABLE_VOICE_SCANNER = origFlag
    else delete process.env.ENABLE_VOICE_SCANNER
  })

  it('should reject unsupported HTTP methods with 405', async () => {
    const req = { method: 'GET', body: {} }
    const res = createMockRes()

    await voiceHandler(req, res)

    assert.strictEqual(res.statusCode, 405)
    assert.strictEqual(res.body.error, 'Method not allowed')
  })

  it('should fall back to safe baseline analysis when audio is empty/silent', async () => {
    const req = { method: 'POST', body: { audio_base64: '' } }
    const res = createMockRes()

    await voiceHandler(req, res)

    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body.risk_level, 'safe')
    assert.strictEqual(res.body.source, 'offline-heuristic')
    assert.ok(res.body.reasons.some(r => r.includes('No clear speech')))
  })

  it('should reject oversized audio payload with 413 Payload Too Large', async () => {
    // Generate simulated oversized payload > 6MB
    const oversizedBase64 = 'A'.repeat(6 * 1024 * 1024 + 10)
    const req = { method: 'POST', body: { audio_base64: oversizedBase64 } }
    const res = createMockRes()

    await voiceHandler(req, res)

    assert.strictEqual(res.statusCode, 413)
    assert.ok(res.body.error.includes('maximum size limit'))
  })
})

describe('Audit Repairs — Client Production Offline Fallback', () => {
  const originalFetch = globalThis.fetch

  it('should fall back to local heuristic analysis when network fetch fails', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch: Network disconnected')
    }

    try {
      const msgResult = await analyzeMessage('Urgent: account locked. Send OTP now.')
      assert.ok(msgResult, 'Must return fallback message analysis')
      assert.strictEqual(msgResult.source, 'offline-heuristic')
      assert.ok(msgResult.fraud_score >= 40, 'Must detect scam heuristically')

      const linkResult = await analyzeLink('https://phishing-sbi-portal.online')
      assert.ok(linkResult, 'Must return fallback link analysis')
      assert.strictEqual(linkResult.source, 'offline-heuristic')

      const screenResult = await analyzeScreenshot()
      assert.ok(screenResult, 'Must return fallback screenshot analysis')

      const reportResult = await analyzeReport({ scam_content: 'Fake electricity bill notice' })
      assert.ok(reportResult, 'Must return fallback scam report analysis')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

describe('Vision Scanner — honest screenshot scoring', () => {
  it('should not invent a risk score when the image was never analyzed', () => {
    const res = analyzeScreenshotFallback()

    assert.strictEqual(res.unverified, true)
    assert.strictEqual(res.analysis_status, 'vision_unavailable')
    assert.strictEqual(res.fraud_score, 0)
    assert.strictEqual(res.confidence, 'low')
    assert.deepStrictEqual(res.reasons, [], 'An unanalyzed image must not claim evidence')
    assert.ok(!/scam detected/i.test(res.analysis), 'Must not assert a scam verdict')
  })

  it('should not return the same hardcoded 65/100 for every screenshot', () => {
    const benign = analyzeScreenshotFallback('Ubuntu terminal — npm test — 74 tests passing, 0 failures, duration 549ms')
    const scam = analyzeScreenshotFallback('URGENT: Your SBI bank account is blocked today. Share OTP and UPI PIN immediately to avoid suspension.')

    assert.notStrictEqual(benign.fraud_score, scam.fraud_score, 'Different images must not share one score')
    assert.ok(benign.fraud_score < 61, `Benign developer text must not reach the scam band (got ${benign.fraud_score})`)
    assert.ok(scam.fraud_score >= 61, `Credential request text must reach the scam band (got ${scam.fraud_score})`)
    assert.strictEqual(benign.unverified, false)
    assert.strictEqual(benign.analysis_status, 'text_only')
  })

  it('should serialize the image into the /api/analyze request body', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url: String(url), body: options.body })
      return {
        ok: true,
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify({ fraud_score: 12, risk_level: 'safe', source: 'gemini' }),
      }
    }

    try {
      const res = await analyzeScreenshot({ image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg' })
      assert.strictEqual(res.source, 'gemini')

      const sent = JSON.parse(calls[0].body)
      assert.strictEqual(sent.type, 'screenshot')
      assert.strictEqual(sent.payload.image_base64, 'iVBORw0KGgoAAAANSUhEUg==', 'Image bytes must reach the server')
      assert.strictEqual(sent.payload.mime_type, 'image/jpeg')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

describe('Vision Scanner — /api/analyze screenshot branch', () => {
  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      headers: {},
      setHeader(k, v) { this.headers[k] = v },
      status(code) { this.statusCode = code; return this },
      json(payload) { this.body = payload; return this },
      end() { return this },
    }
  }

  it('should return an unverified result instead of a fabricated score when no image arrives', async () => {
    const req = { method: 'POST', headers: {}, body: { type: 'screenshot', payload: {} } }
    const res = createMockRes()

    await analyzeHandler(req, res)

    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body.unverified, true)
    assert.strictEqual(res.body.analysis_status, 'vision_unavailable')
    assert.strictEqual(res.body.fraud_score, 0)
    assert.strictEqual(res.body.degraded_reason, 'no-image-payload')
    assert.ok(res.body.vision_diagnostics, 'Diagnostics must always be returned')
  })

  it('should report gemini-key-missing with a full key audit trail', async () => {
    const originalKey = process.env.GEMINI_API_KEY
    const originalViteKey = process.env.VITE_GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    delete process.env.VITE_GEMINI_API_KEY

    try {
      const req = {
        method: 'POST',
        headers: {},
        body: { type: 'screenshot', payload: { image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg' } },
      }
      const res = createMockRes()

      await analyzeHandler(req, res)

      assert.strictEqual(res.body.degraded_reason, 'gemini-key-missing')
      assert.strictEqual(res.body.vision_diagnostics.status, 'no-key')
      assert.ok(
        res.body.vision_diagnostics.keyChecks.some((c) => c.source === 'GEMINI_API_KEY'),
        'Diagnostics must list every environment variable that was checked'
      )
    } finally {
      if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey
      if (originalViteKey !== undefined) process.env.VITE_GEMINI_API_KEY = originalViteKey
    }
  })

  it('should score a benign image with the vision engine instead of the old fixed 65', async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'AIzaSy_test_key_1234567890abcdef'
    let calledUrl = ''
    let calledApiKeyHeader = ''

    globalThis.fetch = async (url, options = {}) => {
      calledUrl = String(url)
      calledApiKeyHeader = options.headers?.['x-goog-api-key'] || ''
      if (String(url).includes('generativelanguage.googleapis.com')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    fraud_score: 8,
                    risk_level: 'safe',
                    confidence: 'high',
                    reasons: ['Ordinary developer terminal window with no fraud cues'],
                    analysis: 'This is a normal terminal screenshot running a test suite.',
                    detected_text: '$ npm test — 74 passing tests, 0 failures',
                    attack_intent: null,
                  }),
                }],
              },
            }],
          }),
        }
      }
      throw new Error(`Unexpected fetch: ${url}`)
    }

    try {
      const req = {
        method: 'POST',
        headers: {},
        body: { type: 'screenshot', payload: { image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg' } },
      }
      const res = createMockRes()

      await analyzeHandler(req, res)

      assert.strictEqual(res.statusCode, 200)
      assert.strictEqual(res.body.source, 'gemini')
      assert.strictEqual(res.body.fraud_score, 8)
      assert.strictEqual(res.body.risk_level, 'safe')
      assert.notStrictEqual(res.body.fraud_score, 65)
      assert.match(calledUrl, /gemini-3\.8-flash/)
      assert.strictEqual(calledApiKeyHeader, process.env.GEMINI_API_KEY, 'Key must be sent as x-goog-api-key header')
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY
      else process.env.GEMINI_API_KEY = originalKey
    }
  })

  it('should expose the real Gemini error instead of a silent fallback', async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'AIzaSy_test_key_1234567890abcdef'

    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({
        error: { code: 403, message: 'Generative Language API has not been used in project before or it is disabled.' },
      }),
    })

    try {
      const req = {
        method: 'POST',
        headers: {},
        body: { type: 'screenshot', payload: { image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg' } },
      }
      const res = createMockRes()

      await analyzeHandler(req, res)

      assert.strictEqual(res.body.degraded_reason, 'gemini-call-failed')
      const attempts = res.body.vision_diagnostics.attempts
      assert.ok(attempts.length >= 1, 'Every model attempt must be recorded')
      assert.strictEqual(attempts[0].status, 403)
      assert.match(attempts[0].error, /Generative Language API has not been used/)
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY
      else process.env.GEMINI_API_KEY = originalKey
    }
  })

  it('should follow Google\'s hint when a model has been retired', async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'AIzaSy_test_key_1234567890abcdef'

    const requestedModels = []
    globalThis.fetch = async (url) => {
      const model = String(url).match(/models\/([^:]+):/)?.[1] || ''
      requestedModels.push(model)

      if (model === 'gemini-3.8-flash') {
        return {
          ok: false,
          status: 404,
          text: async () => JSON.stringify({
            error: {
              code: 404,
              message: 'This model models/gemini-3.8-flash is no longer available. Please update your code to use models/gemini-4.0-flash for the latest features.',
            },
          }),
        }
      }

      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  fraud_score: 12,
                  risk_level: 'safe',
                  reasons: ['Ordinary screenshot'],
                  detected_text: 'hello',
                }),
              }],
            },
          }],
        }),
      }
    }

    try {
      const req = {
        method: 'POST',
        headers: {},
        body: { type: 'screenshot', payload: { image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg' } },
      }
      const res = createMockRes()

      await analyzeHandler(req, res)

      assert.strictEqual(res.body.source, 'gemini')
      assert.strictEqual(res.body.model, 'gemini-4.0-flash')
      assert.ok(
        requestedModels.includes('gemini-4.0-flash'),
        `Expected the replacement model to be requested, got ${requestedModels.join(', ')}`
      )
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY
      else process.env.GEMINI_API_KEY = originalKey
    }
  })

  it('should retry once when Gemini is briefly overloaded', async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'AIzaSy_test_key_1234567890abcdef'

    let calls = 0
    globalThis.fetch = async () => {
      calls += 1
      if (calls === 1) {
        return {
          ok: false,
          status: 503,
          text: async () => '{"error":{"code":503,"message":"This model is currently experiencing high demand."}}',
        }
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  fraud_score: 91,
                  risk_level: 'scam',
                  reasons: ['Fake bank notice asking for an OTP'],
                  detected_text: 'Your account is locked. Share the OTP now.',
                }),
              }],
            },
          }],
        }),
      }
    }

    try {
      const req = {
        method: 'POST',
        headers: {},
        body: { type: 'screenshot', payload: { image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg', debug: true } },
      }
      const res = createMockRes()

      await analyzeHandler(req, res)

      assert.strictEqual(res.body.fraud_score, 91)
      assert.strictEqual(res.body.risk_level, 'scam')
      assert.strictEqual(calls, 2, 'A 503 must trigger exactly one retry')
      assert.ok(res.body.vision_diagnostics.attempts[0].transientRetry, 'The retry must be recorded in diagnostics')
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY
      else process.env.GEMINI_API_KEY = originalKey
    }
  })

  it('should return the hedged result when the preferred model is too slow', async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.GEMINI_API_KEY
    const originalHedge = process.env.VISION_HEDGE_DELAY_MS
    const originalModelTimeout = process.env.VISION_MODEL_TIMEOUT_MS

    process.env.GEMINI_API_KEY = 'AIzaSy_test_key_1234567890abcdef'
    process.env.VISION_HEDGE_DELAY_MS = '100'
    process.env.VISION_MODEL_TIMEOUT_MS = '400'

    const requestedModels = []
    globalThis.fetch = async (url) => {
      const model = String(url).match(/models\/([^:]+):/)?.[1] || ''
      requestedModels.push(model)

      if (model === 'gemini-3.8-flash') {
        // Simulates the real behaviour observed in production: the model
        // accepts the request and never answers.
        return new Promise(() => {})
      }

      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  fraud_score: 77,
                  risk_level: 'scam',
                  reasons: ['Fake payment request'],
                  detected_text: 'Pay now or your account is closed',
                }),
              }],
            },
          }],
        }),
      }
    }

    try {
      const req = {
        method: 'POST',
        headers: {},
        body: { type: 'screenshot', payload: { image_base64: 'iVBORw0KGgoAAAANSUhEUg==', mime_type: 'image/jpeg' } },
      }
      const res = createMockRes()

      const startedAt = Date.now()
      await analyzeHandler(req, res)
      const elapsed = Date.now() - startedAt

      assert.strictEqual(res.body.fraud_score, 77)
      assert.strictEqual(res.body.model, 'gemini-3.5-flash-lite')
      assert.ok(elapsed < 1500, `Hedge should answer fast, took ${elapsed}ms`)
      assert.ok(requestedModels.includes('gemini-3.5-flash-lite'), 'The fallback model must be tried in parallel')
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY
      else process.env.GEMINI_API_KEY = originalKey
      if (originalHedge === undefined) delete process.env.VISION_HEDGE_DELAY_MS
      else process.env.VISION_HEDGE_DELAY_MS = originalHedge
      if (originalModelTimeout === undefined) delete process.env.VISION_MODEL_TIMEOUT_MS
      else process.env.VISION_MODEL_TIMEOUT_MS = originalModelTimeout
    }
  })
})

describe('Vision diagnostics — key resolution & health endpoint', () => {
  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      headers: {},
      setHeader(k, v) { this.headers[k] = v },
      status(code) { this.statusCode = code; return this },
      json(payload) { this.body = payload; return this },
      end() { return this },
    }
  }

  it('should accept Gemini keys stored under any documented env name', () => {
    const resolved = resolveGeminiKey({
      env: { GOOGLE_API_KEY: 'AIzaSy_alias_key_1234567890abcdef' },
    })

    assert.ok(resolved.key, 'Alias env var must be accepted')
    assert.match(resolved.source, /GOOGLE_API_KEY/)
    assert.ok(resolved.checked.length >= 1)
  })

  it('should reject placeholder keys and say why', () => {
    const resolved = resolveGeminiKey({ env: { GEMINI_API_KEY: 'your-gemini-api-key-placeholder' } })

    assert.strictEqual(resolved.key, null)
    const geminiCheck = resolved.checked.find((c) => c.source === 'GEMINI_API_KEY')
    assert.strictEqual(geminiCheck.status, 'is a placeholder value')
  })

  it('should recover a valid key that was pasted with quotes, whitespace or an env prefix', () => {
    const quoted = inspectKey('"AIzaSy_quoted_key_1234567890abcd"')
    assert.ok(quoted.key, 'Surrounding quotes must not disable vision')
    assert.strictEqual(quoted.cleaned, true)

    const prefixed = inspectKey('GEMINI_API_KEY=AIzaSy_prefixed_key_1234567890ab')
    assert.ok(prefixed.key, 'A pasted KEY=value line must not disable vision')
    assert.ok(prefixed.key.startsWith('AIza'))

    const spaces = inspectKey('  AIzaSy_line\nbreak key_1234567890abcdef  ')
    assert.ok(spaces.key)
    assert.ok(!/\s/.test(spaces.key))

    const smartQuotes = inspectKey('\u201CAIzaSy_smart_quote_key_1234567890ab\u201D')
    assert.ok(smartQuotes.key, 'Smart quotes from a document must not disable vision')
    assert.strictEqual(sanitizeKeyValue('\uFEFFAIzaSy_bom_key_1234567890abcdef '), 'AIzaSy_bom_key_1234567890abcdef')
  })

  it('should accept the current Google key format that starts with AQ.', () => {
    const result = inspectKey('AQ.Ab8RN6Jk_example-key_1234567890abcdef')

    assert.ok(result.key, 'AQ. keys are valid Google keys and must not be rejected')
    assert.strictEqual(result.shape, 'Google API key (AQ.…, current format)')
    assert.strictEqual(result.cleaned, false)
  })

  it('should name the exact character that makes a key unusable', () => {
    const result = inspectKey('AIzaSy_key/with/slashes/1234567890ab')

    assert.strictEqual(result.key, null)
    assert.match(result.problem, /unexpected characters/)
    assert.match(result.problem, /position 11/)
  })

  it('should explain that a configured-but-invalid key needs re-saving', async () => {
    const originalKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'AIzaSy_key/with/slashes/1234567890ab'

    try {
      const res = createMockRes()
      await visionHealthHandler({ method: 'GET', headers: {}, query: {} }, res)

      assert.strictEqual(res.body.configured, false)
      assert.match(res.body.hint, /GEMINI_API_KEY is set but unusable/)
      assert.match(res.body.hint, /position \d+/)
      assert.ok(!JSON.stringify(res.body).includes('AIzaSy_key/with'), 'Must never echo the raw key')
    } finally {
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY
      else process.env.GEMINI_API_KEY = originalKey
    }
  })

  it('should report a missing key from /api/vision-health without leaking secrets', async () => {
    const originalKey = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY

    try {
      const res = createMockRes()
      await visionHealthHandler({ method: 'GET', headers: {}, query: {} }, res)

      assert.strictEqual(res.statusCode, 200)
      assert.strictEqual(res.body.configured, false)
      assert.ok(res.body.checkedSources.some((c) => c.source === 'GEMINI_API_KEY'))
      assert.ok(Array.isArray(res.body.envNamesAccepted) && res.body.envNamesAccepted.includes('GEMINI_API_KEY'))
      assert.ok(!JSON.stringify(res.body).includes('AIza'), 'Must never echo a raw key')
    } finally {
      if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey
    }
  })

  it('should probe the real Gemini endpoint and return its status', async () => {
    const originalFetch = globalThis.fetch
    const originalKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'AIzaSy_probe_key_1234567890abcdef'

    let probedUrl = ''
    globalThis.fetch = async (url) => {
      probedUrl = String(url)
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }],
        }),
      }
    }

    try {
      const res = createMockRes()
      await visionHealthHandler({ method: 'GET', headers: {}, query: { probe: '1' } }, res)

      assert.match(probedUrl, /gemini-3\.8-flash:generateContent/)
      assert.strictEqual(res.body.probe.workingModel, 'gemini-3.8-flash')
      assert.strictEqual(res.body.probe.attempts[0].status, 200)
      assert.strictEqual(res.body.probe.attempts[0].text, 'ok')
      assert.strictEqual(res.body.keySource, 'GEMINI_API_KEY env var')
    } finally {
      globalThis.fetch = originalFetch
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY
      else process.env.GEMINI_API_KEY = originalKey
    }
  })
})

import { extractHostname as extractFeedHostname } from '../scripts/sync-threat-feeds.js'

describe('Audit Repairs — Threat Feed Ingestion Logic', () => {
  it('should parse OpenPhish text feed lines into valid domains', () => {
    const rawFeed = `
      http://phish1.example.org/login
      https://phish2.malicious.net/account
      ftp://invalid.scheme.com
      not-a-valid-url
    `
    const lines = rawFeed.split('\n').map(l => l.trim()).filter(Boolean)
    const domains = lines.map(extractFeedHostname).filter(Boolean)
    assert.deepStrictEqual(domains, ['phish1.example.org', 'phish2.malicious.net', 'invalid.scheme.com'])
  })

  it('should parse URLhaus CSV records and skip headers/comments', () => {
    const rawCsv = `# URLhaus Database
# id,dateadded,url,url_status,last_online,threat,tags,urlhaus_link,reporter
"1001","2026-09-12 10:00:00","https://urlhaus-badsite.org/malware.exe","online","2026-09-12","malware","exe","https://urlhaus.abuse.ch","admin"
"1002","2026-09-12 10:05:00","http://second-badsite.biz/drop.php","online","2026-09-12","phish","login","https://urlhaus.abuse.ch","admin"
`
    const lines = rawCsv.split('\n')
    const domains = []
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue
      const parts = line.split(',')
      const rawUrl = parts[2]?.replace(/"/g, '').trim()
      if (rawUrl) {
        const host = extractFeedHostname(rawUrl)
        if (host) domains.push(host)
      }
    }
    assert.deepStrictEqual(domains, ['urlhaus-badsite.org', 'second-badsite.biz'])
  })
})

import blocklistLiteHandler from '../api/blocklist-lite.js'

describe('Audit Repairs — Pre-Click Blocklist Lite Endpoint', () => {
  it('should return 404 when ENABLE_PRE_CLICK_INTERCEPTOR is disabled', async () => {
    const origFlag = process.env.ENABLE_PRE_CLICK_INTERCEPTOR
    process.env.ENABLE_PRE_CLICK_INTERCEPTOR = 'false'

    const req = { method: 'GET' }
    let status = 200
    let text = ''
    const res = {
      setHeader: () => {},
      status: (s) => {
        status = s
        return {
          send: (t) => { text = t },
          end: () => {},
        }
      },
      end: () => {},
    }

    await blocklistLiteHandler(req, res)
    assert.strictEqual(status, 404)
    assert.ok(text.includes('disabled'))

    if (origFlag !== undefined) process.env.ENABLE_PRE_CLICK_INTERCEPTOR = origFlag
    else delete process.env.ENABLE_PRE_CLICK_INTERCEPTOR
  })

  it('should reject non-GET requests with 405 Method Not Allowed', async () => {
    const origFlag = process.env.ENABLE_PRE_CLICK_INTERCEPTOR
    process.env.ENABLE_PRE_CLICK_INTERCEPTOR = 'true'

    const req = { method: 'POST' }
    let status = 200
    const res = {
      setHeader: () => {},
      status: (s) => {
        status = s
        return {
          send: () => {},
          end: () => {},
        }
      },
      end: () => {},
    }

    await blocklistLiteHandler(req, res)
    assert.strictEqual(status, 405)

    if (origFlag !== undefined) process.env.ENABLE_PRE_CLICK_INTERCEPTOR = origFlag
    else delete process.env.ENABLE_PRE_CLICK_INTERCEPTOR
  })
})
