/**
 * GhostNet AI - Explainable Risk Reason Code Dictionary
 *
 * This is the FIXED, authoritative set of reason codes the AI is allowed to return.
 * Any code not in this dictionary is filtered out by safeParseVerdict() in api/analyze.js.
 * The UI reads this dictionary to render chips with labels, icons, and colors.
 */

export const REASON_CODE_DICT = {
  URGENCY_LANGUAGE: {
    label: 'Urgency Language',
    icon: 'Clock',
    color: '#f59e0b',
  },
  IMPERSONATES_BRAND: {
    label: 'Brand Impersonation',
    icon: 'ShieldOff',
    color: '#ef4444',
  },
  REQUESTS_OTP: {
    label: 'OTP / Credential Request',
    icon: 'KeyRound',
    color: '#f43f5e',
  },
  LOOKALIKE_DOMAIN: {
    label: 'Lookalike Domain',
    icon: 'Globe',
    color: '#a78bfa',
  },
  PUNYCODE_DOMAIN: {
    label: 'Punycode / Homograph',
    icon: 'AlertTriangle',
    color: '#f97316',
  },
  NEWLY_REGISTERED_DOMAIN: {
    label: 'Newly Registered Domain',
    icon: 'CalendarX',
    color: '#fb923c',
  },
  REQUESTS_PAYMENT: {
    label: 'Unsolicited Payment Request',
    icon: 'Banknote',
    color: '#10b981',
  },
  KNOWN_MALICIOUS_DOMAIN: {
    label: 'Known Malicious Domain',
    icon: 'ShieldX',
    color: '#ef4444',
  },
  SUSPICIOUS_ATTACHMENT_QR: {
    label: 'Suspicious Attachment / QR',
    icon: 'QrCode',
    color: '#8b5cf6',
  },
  GENERIC_GREETING: {
    label: 'Generic / Impersonal Greeting',
    icon: 'UserX',
    color: '#64748b',
  },
  FAMILY_IMPERSONATION_RISK: {
    label: 'Family Impersonation Scam',
    icon: 'Users',
    color: '#e11d48',
  },
}

/**
 * Set of all valid reason code strings - used for fast O(1) lookup during filtering.
 */
export const VALID_REASON_CODES = new Set(Object.keys(REASON_CODE_DICT))

/**
 * Returns only the reason code strings that exist in the dictionary.
 * Silently discards any AI-hallucinated or unknown codes.
 * @param {string[]} codes - Raw array of reason code strings from AI
 * @returns {string[]} Filtered array of valid code strings
 */
export function filterValidReasonCodes(codes) {
  if (!Array.isArray(codes)) return []
  return codes.filter((c) => typeof c === 'string' && VALID_REASON_CODES.has(c))
}
