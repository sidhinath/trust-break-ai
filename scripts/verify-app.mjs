#!/usr/bin/env node
/**
 * Quick end-to-end verification for TrustBreak AI core modules.
 *
 * Covers:
 *  - centralized aiRouter model chains + normalized verdict schema
 *  - offline scam/safe classification samples
 *  - Senior Mode English/Hindi translation key completeness
 *  - PWA manifest + service worker validity
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  TEXT_MODEL_CHAIN,
  MULTIMODAL_MODEL_CHAIN,
  normalizeRouterVerdict,
} from '../src/lib/aiRouter.js'
import { analyzeMessageContent, analyzeUrlContent } from '../src/lib/scanner.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const results = []

function check(name, fn) {
  try {
    fn()
    results.push({ name, status: 'PASS' })
  } catch (error) {
    results.push({ name, status: 'FAIL', detail: error?.message || String(error) })
  }
}

// ---------------------------------------------------------------------------
// 1. Centralized aiRouter configuration
// ---------------------------------------------------------------------------
check('aiRouter: text fallback chain uses the three configured models in order', () => {
  assert.deepEqual(
    TEXT_MODEL_CHAIN.map(({ provider, model }) => `${provider}/${model}`),
    [
      'groq/openai/gpt-oss-20b',
      'groq/llama-3.1-8b-instant',
      'gemini/gemini-3.5-flash-lite',
    ]
  )
})

check('aiRouter: multimodal chain keeps Gemini 3.5 Flash Lite as primary', () => {
  assert.equal(MULTIMODAL_MODEL_CHAIN[0].provider, 'gemini')
  assert.equal(MULTIMODAL_MODEL_CHAIN[0].model, 'gemini-3.5-flash-lite')
  assert.ok(MULTIMODAL_MODEL_CHAIN.length >= 2, 'Expected at least one fallback model')
})

check('aiRouter: normalized verdict exposes unified + legacy JSON schema', () => {
  const verdict = normalizeRouterVerdict(
    {
      fraud_score: 91,
      risk_level: 'scam',
      reasons: ['OTP request', 'Fake bank domain'],
      analysis: 'Credential harvesting attempt.',
    },
    { provider: 'groq', model: 'openai/gpt-oss-20b' }
  )

  assert.ok(verdict, 'Expected a normalized verdict')
  for (const key of [
    'score',
    'verdict',
    'summary',
    'indicators',
    'fraud_score',
    'risk_level',
    'analysis',
    'ai_analysis',
    'reasons',
    'source',
    'model',
  ]) {
    assert.ok(key in verdict, `Missing normalized schema key: ${key}`)
  }

  assert.equal(verdict.score, 91)
  assert.equal(verdict.verdict, 'scam')
  assert.equal(verdict.fraud_score, 91)
  assert.equal(verdict.risk_level, 'scam')
  assert.equal(verdict.summary, 'Credential harvesting attempt.')
  assert.deepEqual(verdict.indicators, ['OTP request', 'Fake bank domain'])
  assert.deepEqual(verdict.reasons, verdict.indicators)
  assert.equal(verdict.source, 'groq')
  assert.equal(verdict.model, 'openai/gpt-oss-20b')
})

// ---------------------------------------------------------------------------
// 2. Scam vs. safe classification accuracy
// ---------------------------------------------------------------------------
check('Classification: urgent KYC/OTP SMS is flagged as scam', () => {
  const result = analyzeMessageContent(
    'URGENT: Your SBI account will be suspended in 24 hours. Verify your OTP and KYC now at http://fake-sbi.top'
  )
  assert.equal(result.risk_level, 'scam')
  assert.ok(result.fraud_score >= 61, `Expected scam-range score, got ${result.fraud_score}`)
})

check('Classification: lookalike KYC URL is flagged as scam', () => {
  const result = analyzeUrlContent('https://sbi-kyc-verification-portal.online/login')
  assert.equal(result.risk_level, 'scam')
  assert.ok(result.fraud_score >= 70, `Expected high-risk score, got ${result.fraud_score}`)
})

check('Classification: legitimate google.com URL stays safe', () => {
  const result = analyzeUrlContent('https://www.google.com/')
  assert.equal(result.risk_level, 'safe')
  assert.ok(result.fraud_score <= 25, `Expected safe-range score, got ${result.fraud_score}`)
})

// ---------------------------------------------------------------------------
// 3. Senior Mode translation key completeness (en / hi)
// ---------------------------------------------------------------------------
const seniorSources = [
  readProjectFile('src/components/SeniorHomeView.jsx'),
  readProjectFile('src/components/SeniorModeToggleSwitch.jsx'),
].join('\n')

const seniorTranslationKeys = [
  { key: 'pasteAndCheck', en: 'Paste & Check', hi: 'पेस्ट करें और जाँचें' },
  { key: 'screenshotQr', en: 'Check Screenshot / QR', hi: 'स्क्रीनशॉट / QR जाँचें' },
  { key: 'analyzingPhoto', en: 'Analyzing Photo...', hi: 'फोटो की जाँच हो रही है...' },
  { key: 'askFamily', en: 'Ask a Family Member', hi: 'परिवार के सदस्य से पूछें' },
  { key: 'emergencyCall', en: 'Emergency: Call 1930', hi: 'आपातकालीन मदद: 1930 पर कॉल करें' },
  { key: 'simpleQuiz', en: 'Simple Scam Quiz', hi: 'आसान स्कैम क्विज़' },
  { key: 'voiceGuide', en: 'Voice Guide for Home Screen', hi: 'होम स्क्रीन के लिए वॉयस गाइड' },
  { key: 'modeOn', en: 'MODE ON', hi: 'मोड चालू' },
  { key: 'modeOff', en: 'MODE OFF', hi: 'मोड बंद' },
]

check('Senior Mode: every checked key has both en and hi strings', () => {
  const missing = seniorTranslationKeys.flatMap(({ key, en, hi }) => {
    const problems = []
    if (!seniorSources.includes(en)) problems.push(`${key}: missing en "${en}"`)
    if (!seniorSources.includes(hi)) problems.push(`${key}: missing hi "${hi}"`)
    return problems
  })

  assert.deepEqual(missing, [], missing.join('\n'))
})

check('Senior Mode: language selector exposes en-IN and hi-IN', () => {
  assert.ok(seniorSources.includes('"en-IN"'), 'Missing en-IN language option')
  assert.ok(seniorSources.includes('"hi-IN"'), 'Missing hi-IN language option')
  assert.ok(seniorSources.includes('हिन्दी (Hindi)'), 'Missing Hindi language label')
})

// ---------------------------------------------------------------------------
// 4. PWA manifest + service worker validity
// ---------------------------------------------------------------------------
check('PWA manifest: standalone app fields and icons are valid', () => {
  const manifest = JSON.parse(readProjectFile('public/manifest.json'))

  assert.equal(manifest.name, 'TrustBreak AI — Scam Defense')
  assert.equal(manifest.short_name, 'TrustBreak AI')
  assert.equal(manifest.start_url, '/')
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')
  assert.ok(manifest.theme_color && manifest.background_color, 'Missing theme colors')
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'Expected at least two icons')

  for (const icon of manifest.icons) {
    assert.ok(icon.src && icon.sizes && icon.type, `Incomplete icon: ${JSON.stringify(icon)}`)
  }
})

check('PWA service worker: syntax, immediate activation, and network-first navigation', () => {
  const sw = readProjectFile('public/sw.js')

  // Compile without executing: catches syntax errors without needing a browser.
  new Function(sw)

  assert.match(sw, /self\.skipWaiting\(\)/, 'Missing immediate skipWaiting()')
  assert.match(sw, /self\.clients\.claim\(\)/, 'Missing clients.claim()')
  assert.match(sw, /request\.mode === ['"]navigate['"]/, 'Missing navigation-first branch')
  assert.match(sw, /fetch\(request\)/, 'Navigation branch must call fetch(request)')
  assert.match(sw, /CACHE_VERSION = ['"]v3['"]/, 'Expected cache version v3')

  const precacheBlock = sw.match(/const PRECACHE_ASSETS = \[([\s\S]*?)\]/)?.[1] || ''
  assert.ok(precacheBlock.includes("'/index.html'"), 'Expected /index.html in offline precache')
  assert.ok(
    !/['"]\/['"]/.test(precacheBlock),
    'Root "/" must not be precached as a static asset'
  )
})

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const nameWidth = Math.max(...results.map((result) => result.name.length))
console.log('TrustBreak AI — Core Module Verification')
console.log('='.repeat(nameWidth + 10))
for (const result of results) {
  console.log(`${result.status.padEnd(4)} | ${result.name.padEnd(nameWidth)}`)
}

const failures = results.filter((result) => result.status === 'FAIL')
if (failures.length > 0) {
  console.log('\nFailure details:')
  for (const failure of failures) {
    console.log(`- ${failure.name}\n  ${failure.detail}`)
  }
}

const passed = results.length - failures.length
console.log('\nFinal score:')
console.log(`${passed} / ${results.length} passed (${failures.length} failed)`)

process.exitCode = failures.length > 0 ? 1 : 0
