import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  extractAttackSignals,
  reconstructAttackChain,
  inferAttackerIntent,
  findSimilarScams,
  analyzeMessageContent,
  analyzeUrlContent,
} from '../src/lib/scanner.js'
import { SAMPLE_THREATS } from '../src/lib/threatLibrary.js'
import { filterValidReasonCodes, VALID_REASON_CODES } from '../src/lib/reasonCodes.js'

describe('GhostNet AI Scanner Engine Tests', () => {
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
  it('should pass all 11 known reason codes through the filter', () => {
    const allCodes = [...VALID_REASON_CODES]
    assert.strictEqual(allCodes.length, 11, 'Expected exactly 11 valid reason codes')
    const filtered = filterValidReasonCodes(allCodes)
    assert.strictEqual(filtered.length, 11, 'All valid codes should pass through')
    assert.ok(filtered.includes('FAMILY_IMPERSONATION_RISK'), 'Expected FAMILY_IMPERSONATION_RISK in valid codes')
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
    delete process.env.ENABLE_PRE_CLICK_INTERCEPTOR

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
