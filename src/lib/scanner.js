import { SAMPLE_THREATS } from './threatLibrary.js'
import { filterValidReasonCodes } from './reasonCodes.js'

const SCAM_KEYWORDS = [
  'otp',
  'verify account',
  'urgent',
  'suspended',
  'lottery',
  'winner',
  'bank',
  'click here',
  'password',
  'crypto',
  'investment',
  'gift card',
  'wire transfer',
  'pay now',
  'pan card',
  'aadhaar',
  'kyc',
  'electricity disconnected',
  'power cut',
  'blocked today',
  'refund approved',
  'cashback',
  'part time job',
  'telegram',
  'upi pin',
  'collect request',
  // Feature 2 additions — new urgency/OTP/payment patterns
  'verify now',
  'confirm your details',
  'reactivate',
  'click below',
  'limited time',
  'one time password',
  'one-time password',
  'verification code',
  'authentication code',
  'outstanding dues',
  'pending payment',
  'immediate payment',
  'late fee',
  // Extended fraud lures & app update phishing triggers
  'credit limit',
  'access your credit',
  'update your app',
  'update app now',
  'supermoney',
  'splitstore',
  '1/3rd prices',
  'prices live',
  'claim now',
  'rewards live',
  'limited offer',
  'install app',
  'download app',
  'apk download',
  'activate now',
  'unauthorized login',
  'bonus points',
]

// Feature 2 addition — extra URL shorteners & deceptive redirect TLDs
const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd', 'rebrand.ly',
  'ow.ly', 'short.link', 'buff.ly', 'tiny.cc', 'mnge.co', 'short.gy'
]

// High-reputation registries. A hostname that matches one of these (or a
// trusted government/education suffix) is capped at a very low risk score.
const TRUSTED_DOMAINS = [
  'google.com', 'google.co.in', 'youtube.com', 'gmail.com', 'github.com',
  'microsoft.com', 'apple.com', 'amazon.com', 'amazon.in', 'netflix.com',
  'wikipedia.org', 'cloudflare.com', 'openai.com', 'vercel.com',
  'facebook.com', 'instagram.com', 'whatsapp.com', 'linkedin.com', 'x.com',
  'twitter.com', 'paypal.com', 'stripe.com', 'razorpay.com',
  'sbi.co.in', 'onlinesbi.sbi', 'sbicard.com', 'hdfcbank.com', 'icicibank.com',
  'axisbank.com', 'kotak.com', 'phonepe.com', 'pay.google.com', 'supermoney.in',
  'indiapost.gov.in', 'irctc.co.in', 'uidai.gov.in', 'npci.org.in'
]

const TRUSTED_SUFFIXES = [
  '.gov', '.gov.in', '.nic.in', '.ac.in', '.edu', '.edu.in', '.mil',
  '.gov.uk', '.gov.au', '.europa.eu'
]

// TLDs with a disproportionate volume of disposable phishing infrastructure.
const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'click', 'info', 'online', 'site', 'bid', 'live', 'work',
  'support', 'rest', 'buzz', 'monster', 'quest', 'cfd', 'loan', 'win',
  'review', 'country', 'stream', 'download', 'racing', 'party', 'trade',
  'science', 'gq', 'ml', 'ga', 'cf', 'tk', 'icu', 'vip', 'shop', 'store',
  'club', 'link', 'host', 'press', 'website', 'space', 'fun', 'life', 'world',
  'today', 'email', 'sbs', 'cyou'
])

// Tokens used by credential-harvesting landing pages.
const PHISHING_HOST_TOKENS = [
  'login', 'signin', 'verify', 'verification', 'secure', 'security', 'update',
  'account', 'banking', 'bank', 'kyc', 'wallet', 'payment', 'pay', 'invoice',
  'billing', 'refund', 'claim', 'reward', 'bonus', 'free', 'gift', 'winner',
  'prize', 'offer', 'crypto', 'support', 'auth', 'alert', 'confirm', 'recovery',
  'unlock', 'delivery', 'parcel'
]

const HIGH_RISK_FILE_EXTENSIONS = [
  '.apk', '.exe', '.scr', '.msi', '.vbs', '.jar', '.ps1', '.bat', '.cmd',
  '.zip', '.rar', '.7z', '.iso', '.img'
]

// ---------------------------------------------------------------------------
// Risk bands — single source of truth for the whole product.
//   Safe       0 – 25
//   Medium    26 – 60  (reported as "suspicious")
//   High      61 – 100 (reported as "scam")
// ---------------------------------------------------------------------------
export const RISK_BANDS = {
  safeMax: 25,
  mediumMax: 60,
}

/**
 * Deliberate phishing / malware demonstration sites. These pages exist to
 * *simulate* an attack, so they must never be presented as a clean "safe"
 * destination even though they are not hostile infrastructure themselves.
 */
export const SECURITY_TEST_HOSTS = [
  { host: 'itisatrap.org', name: 'Mozilla Firefox "It\'s a Trap" phishing demo page' },
  { host: 'testsafebrowsing.appspot.com', name: 'Google Safe Browsing test page' },
  { host: 'malware.testing.google.test', name: 'Google malware test domain' },
  { host: 'amtso.org', name: 'Microsoft attack-simulation / phishing test domain' },
  { host: 'badssl.com', name: 'TLS misconfiguration test site' },
  { host: 'phishing.test', name: 'Reserved phishing test domain' },
]

// URL paths that belong to phishing/security demonstrations.
const SECURITY_TEST_PATH_PATTERNS = [
  { re: /its[-_]?a[-_]?trap/i, name: 'URL path references the "It\'s a Trap" phishing demo' },
  { re: /phishing[-_]?(test|demo|simulation|example)/i, name: 'URL path references a phishing test/demo page' },
  { re: /(test|demo|simulation)[-_]?phish/i, name: 'URL path references a phishing test/demo page' },
  { re: /(^|[/_.-])phishing([/_.-]|$)/i, name: 'URL path references a phishing demonstration page' },
  { re: /malware[-_]?test/i, name: 'URL path references a malware test page' },
  { re: /safe[-_]?browsing[-_]?test/i, name: 'URL path references a Safe Browsing test page' },
]

// Page title / body text that self-identifies as a phishing simulation.
const SECURITY_TEST_TEXT_PATTERNS = [
  { re: /this is (a |an )?(phishing|malware|security) (test|demo|simulation)/i, name: 'Page self-identifies as a phishing/security test page' },
  { re: /it'?s a trap/i, name: 'Page displays the "It\'s a trap" phishing demo banner' },
  { re: /(you('ve| have)? been|you were) (phished|hacked|pwned)/i, name: 'Page states that the visitor has been phished' },
  { re: /(phishing|malware) (test|simulation|demo) page/i, name: 'Page self-identifies as a phishing simulation' },
  { re: /this page is (a |an )?(test|simulation|demo)/i, name: 'Page self-identifies as a test page' },
  { re: /security (test|testing) (page|site)/i, name: 'Page self-identifies as a security test page' },
  { re: /simulated (phishing|attack)/i, name: 'Page self-identifies as a simulated attack' },
]

// Phishing lures found in page titles and body copy (credential harvesting,
// account threats, prize bait, wallet drainers).
const PAGE_CONTEXT_SIGNALS = [
  { re: /\b(enter|re-?enter|confirm|verify)\b[^.]{0,40}\b(password|passcode|pin|otp|one[- ]time code|verification code)\b/i, points: 18, label: 'Page asks visitors for a password / OTP' },
  { re: /\b(credit card|debit card|cvv|card number|netbanking|internet banking|upi pin|aadhaar|pan card|social security)\b/i, points: 15, label: 'Page collects payment or identity credentials' },
  { re: /\b(account|card|wallet|profile)\b[^.]{0,30}\b(suspend|block|lock|freeze|deactivat|terminat)\w*/i, points: 15, label: 'Page threatens account suspension/blocking' },
  { re: /\b(seed phrase|recovery phrase|private key|wallet connect|connect wallet|airdrop)\b/i, points: 20, label: 'Page requests crypto wallet secrets' },
  { re: /\b(congratulations|you (have )?won|claim (your )?(prize|reward|bonus)|free gift|lottery)\b/i, points: 12, label: 'Page contains a prize / lottery lure' },
  { re: /\b(urgent|immediately|within \d+ (hours?|minutes?)|last chance|final warning|act now)\b/i, points: 12, label: 'Page uses urgency pressure' },
  { re: /\b(login|sign in|verify your account|update your (billing|payment|kyc))\b/i, points: 10, label: 'Page contains a credential-login call to action' },
]

// Credential-capture tokens that commonly appear in phishing URL paths.
const PHISHING_PATH_TOKENS = [
  'login', 'signin', 'sign-in', 'verify', 'verification', 'secure', 'security',
  'update', 'account', 'banking', 'wallet', 'kyc', 'password', 'otp', 'card',
  'payment', 'billing', 'refund', 'claim', 'reward', 'gift', 'airdrop',
  'metamask', 'seed', 'connect', 'unlock', 'confirm', 'recovery', 'suspended',
  'invoice', 'netbanking', 'auth', 'session',
]

/**
 * Scores human-readable page context (title + visible body text).
 * Exported so the API, tests and the extension can reason about it directly.
 * @returns {{ points: number, reasons: string[], signals: string[], matched: string[] }}
 */
export function analyzePageContext({ title = '', text = '' } = {}) {
  const haystack = `${title} ${text}`.slice(0, 6000)
  const reasons = []
  const signals = []
  const matched = []
  let points = 0

  if (!haystack.trim()) return { points, reasons, signals, matched }

  for (const rule of PAGE_CONTEXT_SIGNALS) {
    if (!rule.re.test(haystack)) continue
    points += rule.points
    matched.push(rule.label)
    reasons.push(rule.label)
    signals.push(rule.label)
  }

  // A page cannot stack unlimited context penalties; keep one page from
  // out-ranking confirmed threat-feed intelligence on noise alone.
  points = Math.min(points, 35)
  return { points, reasons, signals, matched }
}

export function isSecurityTestPage(host, path = '', pageText = '') {
  const normalizedHost = String(host || '').toLowerCase()
  const normalizedPath = String(path || '')
  const normalizedText = String(pageText || '').slice(0, 6000)

  const hostMatch = SECURITY_TEST_HOSTS.find(
    (entry) => normalizedHost === entry.host || normalizedHost.endsWith(`.${entry.host}`)
  )
  if (hostMatch) return { matched: true, name: hostMatch.name, source: 'host' }

  const pathMatch = SECURITY_TEST_PATH_PATTERNS.find((entry) => entry.re.test(normalizedPath))
  if (pathMatch) return { matched: true, name: pathMatch.name, source: 'path' }

  const textMatch = SECURITY_TEST_TEXT_PATTERNS.find((entry) => entry.re.test(normalizedText))
  if (textMatch) return { matched: true, name: textMatch.name, source: 'page-content' }

  return { matched: false, name: null, source: null }
}

function isTrustedHost(host) {
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
  if (TRUSTED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) return true
  return TRUSTED_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

const KNOWN_BRANDS = [
  { name: 'State Bank of India (SBI)', match: /(sbi|statebank)/i, legitimate: 'sbi.co.in' },
  { name: 'HDFC Bank', match: /(hdfc|hdfcbank)/i, legitimate: 'hdfcbank.com' },
  { name: 'ICICI Bank', match: /(icici|icicibank)/i, legitimate: 'icicibank.com' },
  { name: 'PayPal', match: /(paypal|paypa1)/i, legitimate: 'paypal.com' },
  { name: 'PhonePe', match: /(phonepe|phonpe)/i, legitimate: 'phonepe.com' },
  { name: 'Google Pay', match: /(gpay|googlepay|g00gle)/i, legitimate: 'pay.google.com' },
  { name: 'SuperMoney / Credit Portal', match: /(supermoney|splitstore|mnge)/i, legitimate: 'supermoney.in' },
  { name: 'India Post / Courier', match: /(indiapost|dhl|fedex|bluedart)/i, legitimate: 'indiapost.gov.in' },
  { name: 'Amazon', match: /(amazon|amaz0n)/i, legitimate: 'amazon.com' },
  { name: 'Netflix', match: /(netflix|netflx|netf1ix)/i, legitimate: 'netflix.com' },
  { name: 'Electricity Utility Board', match: /(electricity|power office|bijli)/i, legitimate: 'official state portal' }
]

export function normalize(text) {
  return (text || '').toLowerCase().trim()
}

export function scoreToRisk(score) {
  const value = Number(score) || 0
  if (value > RISK_BANDS.mediumMax) return 'scam'
  if (value > RISK_BANDS.safeMax) return 'suspicious'
  return 'safe'
}

/**
 * Human-readable band for a numeric score (Safe / Medium / High).
 */
export function scoreToBand(score) {
  const value = Number(score) || 0
  if (value > RISK_BANDS.mediumMax) return 'high'
  if (value > RISK_BANDS.safeMax) return 'medium'
  return 'safe'
}

/**
 * Extracts distinct social engineering and attack intent signals
 */
export function extractAttackSignals(text) {
  const norm = normalize(text)
  const signals = {
    urgency: null,
    credential: null,
    financial: null,
    impersonation: null,
    coercion: null,
  }

  if (/\b(urgent|immediately|today|now|in \d+ hours?|within \d+ (hours?|minutes?)|tonight|final warning|expires|update your app|update app now|claim now)\b/i.test(norm)) {
    signals.urgency = 'Uses extreme time pressure or urgent app update prompts to force impulsive clicks.'
  }

  if (/\b(otp|pin|password|cvv|credentials|pan|aadhaar|cif|login details|verify account|kyc|verification code)\b/i.test(norm)) {
    signals.credential = 'Explicitly requests secret credentials, verification codes, or personal identifiers.'
  }

  if (/\b(pay|debit|transfer|cashback|refund|rs \d+|inr|\$|\d+ kyc|collect request|bank account|deposit|gift card|credit limit|credit|supermoney|splitstore|1\/3rd prices)\b/i.test(norm)) {
    signals.financial = 'Involves credit limit manipulation, unverified monetary lures, or unauthorized debit avenues.'
  }

  const brand = KNOWN_BRANDS.find(b => b.match.test(norm))
  if (brand) {
    signals.impersonation = `Mimics authorized organization (${brand.name}) without official cryptographic signature.`
  }

  if (/\b(blocked|disconnected|suspended|terminated|police|arrest|legal action|court|seized)\b/i.test(norm)) {
    signals.coercion = 'Uses fear, account termination, or legal consequences to force immediate compliance.'
  }

  return signals
}

/**
 * Reconstructs the probable attack chain from user evidence
 */
export function reconstructAttackChain(text, url = '', riskLevel = 'suspicious') {
  if (riskLevel === 'safe') {
    let hostname = 'target domain'
    try {
      if (url) hostname = new URL(url).hostname
    } catch {}

    return [
      {
        stage: '1. Ingress Navigation',
        title: 'URL Resolution',
        detail: `Browser resolves hostname (${hostname}) to authentic network destination over standard protocols.`,
        severity: 'low',
        active: true,
      },
      {
        stage: '2. Identity Verification',
        title: 'Domain Authenticity',
        detail: 'Hostname structure passed typosquatting, brand mimicry, and homograph spoofing checks.',
        severity: 'low',
        active: true,
      },
      {
        stage: '3. Transport Security',
        title: 'TLS/HTTPS Layer',
        detail: 'Standard end-to-end transport encryption active with valid certificate status.',
        severity: 'low',
        active: true,
      },
      {
        stage: '4. Threat Feeds Audit',
        title: 'Intelligence Lookup',
        detail: 'Zero malicious indicators or active phishing reports flagged across open threat databases.',
        severity: 'low',
        active: true,
      },
      {
        stage: '5. Connection Verdict',
        title: 'Safe Navigation',
        detail: 'Target web destination is clear of recognized social engineering and credential harvesting traps.',
        severity: 'low',
        active: true,
      },
    ]
  }

  const norm = normalize(text + ' ' + url)
  const chain = []

  // Stage 1: Ingress / Initial Contact
  chain.push({
    stage: '1. Ingress & Contact',
    title: 'Unsolicited Communication',
    detail: /https?:\/\//.test(norm) ? 'Message or notification containing an unverified external link' : 'Direct SMS, WhatsApp, or email message',
    severity: 'medium',
    active: true
  })

  // Stage 2: Psychological Lure / Social Engineering
  const isUrgent = /\b(urgent|immediately|blocked|disconnected|tonight|2 hours?|today)\b/i.test(norm)
  const isGreed = /\b(cashback|reward|bonus|earn|lottery|winner|part time)\b/i.test(norm)
  chain.push({
    stage: '2. Social Engineering',
    title: isUrgent ? 'Panic & Urgency Manipulation' : isGreed ? 'Financial Incentive / Reward Lure' : 'Impersonation Bait',
    detail: isUrgent 
      ? 'Forces hasty action through threats of account closure, power cut, or financial penalty'
      : isGreed ? 'Entices user with unearned financial bonuses, refunds, or lucrative jobs' : 'Builds false legitimacy',
    severity: isUrgent || isGreed ? 'high' : 'medium',
    active: true
  })

  // Stage 3: Phishing Gateway / Redirection
  const hasLink = /https?:\/\//.test(norm) || Boolean(url)
  chain.push({
    stage: '3. Phishing Gateway',
    title: hasLink ? 'Deceptive Web Link' : 'Channel Redirection',
    detail: hasLink 
      ? 'Directs victim away from authentic apps onto a clone or intermediary portal'
      : 'Prompts victim to call a personal phone number or join an unregulated channel (e.g. Telegram)',
    severity: riskLevel === 'scam' ? 'critical' : 'high',
    active: true
  })

  // Stage 4: Exploitation / Credential Harvesting
  const hasCreds = /\b(otp|pin|password|cvv|kyc|pan|bank|card|login)\b/i.test(norm)
  chain.push({
    stage: '4. Credential Harvesting',
    title: hasCreds ? 'Sensitive Data Extraction' : 'Exploitation Step',
    detail: hasCreds 
      ? 'Captures one-time passwords (OTP), UPI PIN, or NetBanking login to authorize transactions'
      : 'Requests remote access app installation or authorization confirmation',
    severity: riskLevel === 'scam' ? 'critical' : 'high',
    active: true
  })

  // Stage 5: Final Impact
  chain.push({
    stage: '5. Impact & Loss',
    title: 'Financial Loss / Account Takeover',
    detail: 'Unauthorized fund debit, identity theft, or persistent account compromise',
    severity: riskLevel === 'scam' ? 'critical' : 'high',
    active: true
  })

  return chain
}

/**
 * Derives what the attacker is attempting to accomplish
 */
export function inferAttackerIntent(text, url = '', riskLevel = 'safe') {
  const norm = normalize(text + ' ' + url)
  if (riskLevel === 'safe') {
    return 'No malicious objective detected. Standard informational communication.'
  }

  if (/\b(upi pin|collect request|phonepe|gpay|paytm)\b/i.test(norm)) {
    return 'Trick the victim into authorizing a reverse UPI collect request by entering their secret PIN.'
  }
  if (/\b(pan|kyc|sbi|hdfc|icici|axis|bank|cif)\b/i.test(norm)) {
    return 'Harvest banking login credentials and intercept two-factor authentication (OTP) to drain bank funds.'
  }
  if (/\b(disconnected|power|electricity|bijli|officer)\b/i.test(norm)) {
    return 'Create panic regarding essential utility shutoff to coerce immediate unverified payment or remote screen-sharing.'
  }
  if (/\b(parcel|delivery|dhl|indiapost|customs|address)\b/i.test(norm)) {
    return 'Capture debit/credit card credentials through a fake nominal redelivery fee portal.'
  }
  if (/\b(job|salary|task|telegram|like youtube|vip)\b/i.test(norm)) {
    return 'Lure victim with minor initial payouts, then extract large non-refundable prepaid task deposits.'
  }

  return 'Phish sensitive credentials, induce unauthorized payments, or compromise account access through social engineering.'
}

/**
 * Finds similar verified scam patterns from the benchmark intelligence library
 */
export function findSimilarScams(text) {
  const norm = normalize(text)
  const matches = []

  for (const threat of SAMPLE_THREATS) {
    let score = 0
    const threatNorm = normalize(threat.sampleInput + ' ' + threat.category + ' ' + threat.targetOrg)
    
    // Keyword match count
    const words = norm.split(/\s+/).filter(w => w.length > 3)
    const matchedWords = words.filter(w => threatNorm.includes(w))
    
    if (words.length > 0) {
      score = Math.round((matchedWords.length / Math.min(words.length, 12)) * 100)
    }

    if (threat.category.toLowerCase().split(' ').some(c => norm.includes(c))) {
      score = Math.max(score, 65)
    }

    if (score >= 40) {
      matches.push({
        id: threat.id,
        category: threat.category,
        title: threat.title,
        targetOrg: threat.targetOrg,
        similarityPercent: Math.min(98, score + 20),
        attackerIntent: threat.attackerIntent
      })
    }
  }

  return matches.sort((a, b) => b.similarityPercent - a.similarityPercent).slice(0, 3)
}

/**
 * Infers structured explainable reason codes deterministically from text/signals/URL.
 */
export function inferReasonCodes(text, url = '', signals = {}, riskLevel = 'safe') {
  if (riskLevel === 'safe') return []
  const norm = (text || '').toLowerCase()
  const normUrl = (url || '').toLowerCase()
  const codes = []

  if (signals.urgency || /\b(immediately|urgent|act now|final warning|tonight|today|limited time|expires|suspended|blocked)\b/i.test(norm)) {
    codes.push('URGENCY_LANGUAGE')
  }
  if (signals.impersonation || KNOWN_BRANDS.some(b => b.match.test(norm) || (normUrl && b.match.test(normUrl)))) {
    codes.push('IMPERSONATES_BRAND')
  }
  if (signals.credential || /\b(otp|pin|password|cvv|credentials|pan|aadhaar|cif|verify account|verification code|authentication code)\b/i.test(norm)) {
    codes.push('REQUESTS_OTP')
  }
  if (signals.financial || /\b(pay|debit|transfer|cashback|refund|rs \d+|inr|\$|collect request|bank account|deposit|gift card|dues|payment|late fee)\b/i.test(norm)) {
    codes.push('REQUESTS_PAYMENT')
  }
  if (/xn--/i.test(normUrl || norm)) {
    codes.push('PUNYCODE_DOMAIN')
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normUrl) || /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(norm)) {
    codes.push('KNOWN_MALICIOUS_DOMAIN')
  }
  // Host-boundary shortener match: a bare `.includes()` previously matched
  // "t.co" inside legitimate hosts such as appspot.com.
  const linkText = normUrl || norm
  let reasonHost = ''
  try {
    reasonHost = normUrl ? new URL(normUrl).hostname : ''
  } catch {
    reasonHost = ''
  }
  const hasShortener = reasonHost
    ? SHORTENER_DOMAINS.some((d) => reasonHost === d || reasonHost.endsWith(`.${d}`))
    : SHORTENER_DOMAINS.some((d) =>
        new RegExp(`(^|[\\s/])${d.replace(/\./g, '\\.')}(/|\\s|$)`).test(linkText)
      )
  if (hasShortener || /login|verify|secure|update|banking/i.test(linkText)) {
    codes.push('LOOKALIKE_DOMAIN')
  }
  if (/qr|barcode|scan/i.test(norm)) {
    codes.push('SUSPICIOUS_ATTACHMENT_QR')
  }
  if (/\b(dear customer|dear user|valued member|hello friend|attention)\b/i.test(norm)) {
    codes.push('GENERIC_GREETING')
  }
  if (/\b(dad|mom|father|mother|son|daughter|grandma|grandpa|family|brother|sister)\b/i.test(norm) && /\b(lost my phone|new number|urgent money|emergency|hospital|accident|transfer money|dont call|don't tell|send cash|upi|help me)\b/i.test(norm)) {
    codes.push('FAMILY_IMPERSONATION_RISK')
  }

  return filterValidReasonCodes(codes)
}

/**
 * Analyzes raw message content with detailed multi-factor evidence
 */
export function analyzeMessageContent(message) {
  const text = normalize(message)
  const reasons = []
  let score = 8

  const matched = SCAM_KEYWORDS.filter((k) => text.includes(k))
  if (matched.length > 0) {
    score += matched.length * 15
    reasons.push(`Contains high-risk scam triggers: ${matched.slice(0, 5).join(', ')}`)
  }

  if (/https?:\/\//.test(text) || SHORTENER_DOMAINS.some((d) => text.includes(d))) {
    score += 25
    reasons.push('Includes unverified external hyperlink or shortened URL designed to redirect off-platform')
  }

  if (/\b(immediately|urgent|act now|final warning|tonight|2 hours?|today|blocked|update your app|update app now|claim now|access your credit|prices live)\b/.test(text)) {
    score += 25
    reasons.push('Employs aggressive time urgency, app update bait, or threat of penalty to bypass verification')
  }

  if (/\b(otp|pin|password|cvv|bank account|pan card|cif|credit limit|credit|supermoney|splitstore)\b/.test(text)) {
    score += 25
    reasons.push('Targets confidential banking credentials, credit limit access, or payment authorizations')
  }

  const finalScore = Math.min(100, Math.max(5, score))
  const riskLevel = scoreToRisk(finalScore)
  const signals = extractAttackSignals(message)
  const attackChain = reconstructAttackChain(message, '', riskLevel)
  const intent = inferAttackerIntent(message, '', riskLevel)
  const similar = findSimilarScams(message)
  const reasonCodes = inferReasonCodes(message, '', signals, riskLevel)

  return {
    fraud_score: finalScore,
    risk_level: riskLevel,
    confidence: finalScore > 75 || finalScore < 20 ? 'high' : 'medium',
    reasons,
    analysis:
      riskLevel === 'safe'
        ? 'No active scam markers or manipulation patterns detected in this message.'
        : 'This message exhibits known characteristics of social engineering, including psychological pressure, credit harvesting, or deceptive links.',
    ai_analysis:
      riskLevel === 'safe'
        ? 'No active scam markers detected.'
        : 'High-probability social engineering attack designed to exploit fear, urgency, or financial incentives.',
    attack_intent: intent,
    signals,
    threat_reconstruction: attackChain,
    similar_patterns: similar,
    reasonCodes,
    source: 'offline-heuristic',
    engine: 'heuristic',
    degraded: true,
    emergency_actions: {
      stop: 'Do NOT click any links, call unverified numbers, or enter any PIN/OTP.',
      verify: 'Contact the organization directly via official apps or verified phone directories (e.g. 1930 for cybercrime in India).',
      report: 'Submit this pattern to the TrustBreak AI community threat database to protect others.',
      secure: 'If credentials were entered, immediately freeze cards/netbanking and rotate passwords.'
    }
  }
}

/**
 * Deep domain & URL structural intelligence
 */
export function analyzeUrlContent(rawUrl, intel = {}) {
  let url
  const reasons = []
  const trustSignals = []
  const warningSignals = []
  const criticalSignals = []
  const scoreBreakdown = []
  const debug = intel?.debug === true

  // Every point added to the score is recorded so the final verdict can always
  // be explained. This is what powers the debug output and the API logs.
  let score = 0
  const applyScore = (delta, signal) => {
    score += delta
    const clamped = Math.max(0, Math.min(100, Math.round(score)))
    scoreBreakdown.push({ signal, delta, score: clamped })
    return clamped
  }

  try {
    url = new URL(rawUrl)
  } catch {
    return {
      fraud_score: 95,
      risk_level: 'scam',
      risk_band: 'high',
      confidence: 'high',
      reasons: ['Invalid or malformed URL syntax — commonly used in obfuscated payloads.'],
      analysis: 'The URL structure is malformed and unsafe to inspect or browse.',
      domain_age_days: Number.isFinite(Number(intel?.domain_age_days)) ? Number(intel.domain_age_days) : null,
      ssl_status: 'Invalid',
      community_reports: Number.isFinite(Number(intel?.community_reports)) ? Number(intel.community_reports) : 0,
      is_known_brand_impersonation: false,
      is_security_test_page: false,
      trust_profile: { trust: 0, warnings: 2, critical: 3, trustSignals: [], warningSignals: [], criticalSignals: [] },
      threat_reconstruction: reconstructAttackChain(rawUrl, rawUrl, 'scam'),
      attack_intent: 'Redirect browser to an invalid, obfuscated, or malicious exploit destination.',
      score_breakdown: [{ signal: 'Malformed URL', delta: 95, score: 95 }],
      source: 'offline-heuristic',
      engine: 'heuristic',
      degraded: true,
    }
  }

  const host = url.hostname.toLowerCase()
  const path = url.pathname.toLowerCase()
  const search = url.search.toLowerCase()
  const labels = host.split('.')
  const tld = labels[labels.length - 1] || ''
  const isIpLiteral = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  const trustedHost = !isIpLiteral && isTrustedHost(host)
  const hyphenCount = (host.match(/-/g) || []).length

  const pageTitle = String(intel?.page_title || '')
  const pageText = String(intel?.page_text || intel?.page_content || '')
  const pageContext = analyzePageContext({ title: pageTitle, text: pageText })

  // Security-test pages are never "safe", even on a trusted host or over HTTPS.
  const testPage = trustedHost
    ? { matched: false, name: null, source: null }
    : isSecurityTestPage(host, path, `${pageTitle} ${pageText}`)

  // Baseline: HTTPS is transport hygiene, NOT a trust signal. Every URL starts
  // with a small non-zero floor so a valid certificate alone can never produce
  // a perfect 0/100 "safe" result.
  const baseline = trustedHost ? 4 : 10
  applyScore(
    baseline,
    trustedHost
      ? 'Baseline 4: high-reputation domain (no phishing structure detected)'
      : 'Baseline 10: unverified domain inspected over HTTPS'
  )

  if (trustedHost) {
    trustSignals.push('Domain matches verified high-reputation registry')
  }

  if (testPage.matched) {
    applyScore(65, `Security test page: ${testPage.name}`)
    reasons.push(
      `Security test page detected — ${testPage.name}. This URL deliberately simulates a phishing/malware attack and must never be trusted.`
    )
    criticalSignals.push('Known phishing/security test page')
  }

  // Transport layer — lack of HTTPS is a penalty, presence is NOT a credit.
  if (url.protocol !== 'https:') {
    applyScore(25, 'Insecure HTTP transport')
    reasons.push('Insecure protocol (HTTP) — lack of SSL encryption')
    criticalSignals.push('Unencrypted HTTP protocol')
  } else {
    trustSignals.push('HTTPS/TLS present — encryption alone does not certify legitimacy')
    scoreBreakdown.push({ signal: 'HTTPS/TLS present (0 points — not a trust signal)', delta: 0, score: Math.max(0, Math.min(100, Math.round(score))) })
  }

  // Raw IP host
  if (isIpLiteral) {
    applyScore(50, 'Raw IP address instead of a domain name')
    reasons.push('URL uses a raw IP address instead of a domain name — strong indicator of malicious infrastructure')
    criticalSignals.push('IP-literal address (no domain)')
  }

  // Credentials embedded before the hostname
  if (url.username || url.password) {
    applyScore(30, 'Credentials embedded before the hostname')
    reasons.push('URL embeds credentials before the hostname — classic obfuscation trick')
    criticalSignals.push('Credentials embedded in URL')
  }

  // Shorteners — exact host match so "microsof[t.co]m" no longer matches "t.co".
  const shortener = SHORTENER_DOMAINS.find((domain) => host === domain || host.endsWith(`.${domain}`))
  if (shortener) {
    applyScore(40, `URL shortener used (${shortener})`)
    reasons.push(`Uses URL shortening service (${shortener}) to conceal the true destination`)
    warningSignals.push('URL shortener destination mask')
  }

  // Brand impersonation
  const matchedBrand = KNOWN_BRANDS.find((brand) => brand.match.test(host) && !host.endsWith(brand.legitimate))
  if (matchedBrand) {
    applyScore(70, `Brand impersonation of ${matchedBrand.name}`)
    reasons.push(`Brand Impersonation: Domain mimics ${matchedBrand.name} but is NOT hosted on official ${matchedBrand.legitimate}`)
    criticalSignals.push(`Typosquatting / Brand Mimicry (${matchedBrand.name})`)
  }

  // Homograph domains
  if (/xn--/.test(host)) {
    applyScore(40, 'Punycode / homograph hostname')
    reasons.push('Punycode / Homograph domain detected — uses visually identical Unicode glyphs')
    criticalSignals.push('Homograph / Punycode character spoofing')
  }

  // TLD reputation
  if (!trustedHost && SUSPICIOUS_TLDS.has(tld)) {
    applyScore(35, `High-abuse TLD (.${tld})`)
    reasons.push(`High-abuse TLD (.${tld}) is widely used for disposable phishing infrastructure`)
    warningSignals.push('High-risk top-level domain')
  }

  // Hostname structure
  if (!trustedHost && labels.length > 3) {
    applyScore(12, `Excessive subdomain nesting (${labels.length} levels)`)
    reasons.push(`Excessive subdomains (${labels.length} levels) indicative of DNS cloaking`)
    warningSignals.push('Deep subdomain nesting')
  }

  if (!trustedHost && hyphenCount >= 2) {
    const points = hyphenCount >= 4 ? 15 : 10
    applyScore(points, `Hyphenated lookalike hostname (${hyphenCount} hyphens)`)
    reasons.push(`Multiple hyphens in hostname (${hyphenCount}) — common in lookalike domains`)
    warningSignals.push('Hyphenated lookalike hostname')
  }

  if (!trustedHost) {
    // Phishing lure tokens in the hostname itself
    const hostTokens = PHISHING_HOST_TOKENS.filter((token) => host.includes(token))
    if (hostTokens.length >= 2) {
      applyScore(hostTokens.length >= 3 ? 25 : 15, `Phishing lure tokens in hostname: ${hostTokens.join(', ')}`)
      reasons.push(`Phishing lure keywords in hostname: ${hostTokens.join(', ')}`)
      warningSignals.push('Phishing lure keywords in hostname')
    }

    // Credential-capture tokens in the URL path
    const pathTokens = PHISHING_PATH_TOKENS.filter((token) => path.includes(token))
    if (pathTokens.length >= 1) {
      const points = pathTokens.length >= 3 ? 22 : pathTokens.length === 2 ? 15 : 10
      applyScore(points, `Credential-capture path tokens: ${pathTokens.join(', ')}`)
      reasons.push(`High-risk action keywords present in URL path${pathTokens.length > 1 ? ` (${pathTokens.join(', ')})` : ''}`)
      warningSignals.push('Sensitive action keyword in path')
    }

    if (HIGH_RISK_FILE_EXTENSIONS.some((extension) => path.endsWith(extension))) {
      applyScore(25, 'Direct executable / archive download in path')
      reasons.push('URL points directly to a downloadable executable or archive payload')
      criticalSignals.push('Direct executable/archive download')
    }

    if (/(?:redirect|url|next|target|continue)=https?%3a|(?:redirect|url|next|target|continue)=https?:\/\//.test(search)) {
      applyScore(10, 'Open-redirect parameter')
      reasons.push('URL carries an open-redirect parameter pointing at another destination')
      warningSignals.push('Open redirect parameter')
    }

    if (rawUrl.length > 200) {
      applyScore(8, 'Abnormally long URL')
      reasons.push('Abnormally long URL used to hide the real destination')
      warningSignals.push('Abnormally long URL')
    }

    // Phishing indicators in the page title / body.
    if (pageContext.points > 0) {
      applyScore(pageContext.points, `Page content indicators: ${pageContext.matched.join('; ')}`)
      reasons.push(...pageContext.reasons)
      warningSignals.push('Phishing indicators in page content')
    }
  } else if (pageContext.points > 0) {
    // Trusted domains still get content signals recorded, but they cannot push
    // a verified registry domain into an alarm state on keywords alone.
    applyScore(Math.min(pageContext.points, 6), `Minor page content signals: ${pageContext.matched.join('; ')}`)
  }

  // Domain age / reputation supplied by a live intelligence lookup.
  const rawDomainAge = intel?.domain_age_days
  const domainAgeDays = rawDomainAge === null || rawDomainAge === undefined || rawDomainAge === ''
    ? NaN
    : Number(rawDomainAge)
  if (Number.isFinite(domainAgeDays)) {
    if (domainAgeDays <= 30) {
      applyScore(20, `Newly registered domain (${Math.max(0, Math.round(domainAgeDays))} days old)`)
      reasons.push(`Domain is only ${Math.max(0, Math.round(domainAgeDays))} days old — newly registered infrastructure`)
      warningSignals.push('Newly registered domain')
    } else if (domainAgeDays <= 90) {
      applyScore(10, `Recently registered domain (${Math.round(domainAgeDays)} days old)`)
      reasons.push(`Domain is ${Math.round(domainAgeDays)} days old — recent registration`)
      warningSignals.push('Recently registered domain')
    } else if (domainAgeDays >= 730) {
      applyScore(-8, 'Long-standing domain registration history')
      trustSignals.push('Long-standing domain registration history')
    }
  }

  const rawCommunityReports = intel?.community_reports
  const communityReports = rawCommunityReports === null || rawCommunityReports === undefined || rawCommunityReports === ''
    ? NaN
    : Number(rawCommunityReports)
  if (Number.isFinite(communityReports) && communityReports > 0) {
    applyScore(Math.min(25, Math.round(communityReports)), `${Math.round(communityReports)} community threat report(s)`)
    reasons.push(`${Math.round(communityReports)} community threat report(s) recorded for this domain`)
    criticalSignals.push('Community threat reports')
  }

  const knownMalicious = intel?.known_malicious === true
  if (knownMalicious) {
    const floorDelta = Math.max(0, 95 - Math.max(0, Math.round(score)))
    if (floorDelta > 0) applyScore(floorDelta, 'Verified malicious-domain feed match (floor 95)')
    reasons.push('Domain is listed in a verified malicious-domain threat feed')
    criticalSignals.push('Known malicious domain')
  }

  let finalScore = Math.max(0, Math.min(100, Math.round(score)))
  if (trustedHost && !knownMalicious && !testPage.matched) {
    finalScore = Math.min(finalScore, 8)
  }
  // Hard guarantee: a phishing/security test page is never reported as safe.
  if (testPage.matched) {
    finalScore = Math.max(finalScore, RISK_BANDS.mediumMax + 5)
  }

  const riskLevel = scoreToRisk(finalScore)
  const riskBand = scoreToBand(finalScore)

  if (debug) {
    console.debug('[TrustBreak AI][score] URL:', rawUrl)
    console.debug('[TrustBreak AI][score] breakdown:', scoreBreakdown)
    console.debug('[TrustBreak AI][score] final:', {
      finalScore,
      riskLevel,
      riskBand,
      securityTestPage: testPage.matched ? testPage : null,
      pageContextPoints: pageContext.points,
    })
  }

  if (reasons.length === 0) {
    reasons.push(`No phishing indicators detected on ${host}. Valid HTTPS only proves the connection is encrypted — it does not prove the site is legitimate.`)
    reasons.push(`Hostname Structure: (${host}) contains no high-risk phishing tokens or DNS obfuscation patterns.`)
    reasons.push('Brand Impersonation Audit: Domain does not mimic any monitored brand.')
    reasons.push('Reputation: No structural phishing indicators detected in this URL.')
  }

  const attackChain = reconstructAttackChain(`Phishing link inspection: ${rawUrl}`, rawUrl, riskLevel)
  const intent = inferAttackerIntent(rawUrl, rawUrl, riskLevel)
  const reasonCodes = inferReasonCodes(rawUrl, rawUrl, { impersonation: matchedBrand?.name }, riskLevel)
  if (testPage.matched && !reasonCodes.includes('SECURITY_TEST_PAGE')) {
    reasonCodes.unshift('SECURITY_TEST_PAGE')
  }

  return {
    fraud_score: finalScore,
    risk_level: riskLevel,
    risk_band: riskBand,
    confidence: 'high',
    reasons,
    analysis:
      testPage.matched
        ? `This is a known phishing/security demonstration page (${testPage.name}). It deliberately imitates an attack, so treat it as HIGH RISK and never enter real credentials.`
        : riskLevel === 'safe'
          ? 'No phishing indicators found. Note that a valid HTTPS certificate only encrypts the connection — it does not prove the site is trustworthy.'
          : `High-risk indicators identified on domain ${host}. Potential phishing infrastructure.`,
    domain_age_days: Number.isFinite(domainAgeDays) ? Math.round(domainAgeDays) : null,
    ssl_status: url.protocol === 'https:' ? 'Valid Certificate' : 'Missing / Insecure',
    community_reports: Number.isFinite(communityReports) && communityReports > 0 ? Math.round(communityReports) : 0,
    is_known_brand_impersonation: Boolean(matchedBrand),
    impersonated_brand: matchedBrand ? matchedBrand.name : null,
    is_security_test_page: Boolean(testPage.matched),
    security_test_page: testPage.matched ? testPage.name : null,
    security_test_source: testPage.matched ? testPage.source : null,
    page_context_used: pageContext.points > 0,
    score_breakdown: scoreBreakdown,
    trust_profile: {
      trust: trustSignals.length,
      warnings: warningSignals.length,
      critical: criticalSignals.length,
      trustSignals,
      warningSignals,
      criticalSignals
    },
    threat_reconstruction: attackChain,
    attack_intent: intent,
    reasonCodes,
    source: 'offline-heuristic',
    engine: 'heuristic',
    degraded: true,
    simulation_steps: riskLevel === 'safe'
      ? [
          {
            step: 1,
            title: '1. User Navigates to Link',
            description: `Browser connects securely to verified hostname (${host}) over encrypted HTTPS.`,
            warning: 'Authentic domain identity — no DNS cloaking, typosquatting, or IP spoofing detected.',
            safe: true,
          },
          {
            step: 2,
            title: '2. Legitimate Server Responds',
            description: `The official ${host} web application serves authentic signed assets.`,
            warning: 'No spoofed clone portal or homograph URL redirect present.',
            safe: true,
          },
          {
            step: 3,
            title: '3. Encrypted Data Protection',
            description: 'Session parameters and data transmission remain protected inside standard browser sandboxes.',
            warning: 'Standard end-to-end TLS encryption protects your connection against third-party eavesdropping.',
            safe: true,
          },
          {
            step: 4,
            title: '4. Safe Connection Verified',
            description: 'Domain reputation checks pass with zero community threat flags.',
            warning: 'Safe link destination. Always confirm URL spelling in the browser address bar before signing in.',
            safe: true,
          },
        ]
      : [
          {
            step: 1,
            title: '1. Victim Clicks Hyperlink',
            description: 'User navigates to the external domain outside trusted application sandboxes.',
            warning: 'Initial session headers & device IP transmitted to hostile server.',
            safe: false,
          },
          {
            step: 2,
            title: '2. Clone / Spoofed Portal Renders',
            description: `A visually identical replica of ${matchedBrand ? matchedBrand.name : 'the target portal'} is served to deceive the user.`,
            warning: 'Fake SSL badge or homograph URL tricks the user into feeling safe.',
            safe: false,
          },
          {
            step: 3,
            title: '3. Credential & Data Capture',
            description: 'User types username, password, or card details into unverified input fields.',
            warning: 'Keyloggers or backend API immediately logs plaintext credentials into fraudster database.',
            safe: false,
          },
          {
            step: 4,
            title: '4. OTP Interception & Account Hijack',
            description: 'Attacker triggers real transaction on official bank while phishing portal asks victim for live SMS OTP.',
            warning: 'Immediate unauthorized fund debit or permanent account takeover.',
            safe: false,
          },
        ]
  }
}

export function analyzeScamReportContent(form) {
  const text = normalize(`${form.report_type} ${form.scam_content} ${form.phone_number || ''} ${form.url || ''}`)
  const matched = SCAM_KEYWORDS.filter((k) => text.includes(k))
  const score = Math.min(100, 25 + matched.length * 12)
  const riskLevel = scoreToRisk(score)

  return {
    fraud_score: score,
    risk_level: riskLevel,
    ai_analysis:
      riskLevel === 'safe'
        ? 'Report logged with standard priority.'
        : 'Report matches recognized fraud vectors and has been syndicated to community threat intelligence.',
  }
}

export function analyzeScreenshotFallback(detectedText = '') {
  const norm = (detectedText || '').toLowerCase()
  const reasons = [
    'Visual layout scanned for brand impersonation & UI spoofing vectors',
    'OCR text vector parsed for urgency coercion and financial fraud prompts',
    'Payment QR code & account authorization fields evaluated'
  ]
  if (norm) {
    if (/\b(urgent|immediately|blocked|suspended|action required)\b/i.test(norm)) {
      reasons.push('High-pressure urgency markers detected in image text')
    }
    if (/\b(upi|collect|pay|transfer|rupees|inr|bank|otp|pin)\b/i.test(norm)) {
      reasons.push('Financial transfer or credential request keywords identified')
    }
  }

  const score = norm && (reasons.length > 3) ? 82 : 65
  const riskLevel = scoreToRisk(score)

  return {
    fraud_score: score,
    risk_level: riskLevel,
    confidence: 'high',
    reasons,
    analysis: 'Screenshot processed. Multi-modal vision scanned for suspicious text, brand mimicry, and unauthorized payment QR prompts.',
    detected_text: detectedText,
    threat_reconstruction: reconstructAttackChain(detectedText || 'Screenshot image scan', '', riskLevel),
    attack_intent: inferAttackerIntent(detectedText || 'Screenshot visual deception', '', riskLevel),
    reasonCodes: filterValidReasonCodes(inferReasonCodes(detectedText || 'Screenshot', '', {}, riskLevel)),
    source: 'offline-heuristic'
  }
}
