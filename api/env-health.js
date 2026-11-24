import { GEMINI_KEY_ENV_NAMES, inspectKey } from '../src/lib/vision.js'
import {
  SUPABASE_ANON_KEY_NAMES,
  SUPABASE_SERVICE_KEY_NAMES,
  SUPABASE_URL_NAMES,
  getSupabaseAnonKey,
  getSupabaseServiceKey,
  getSupabaseUrl,
} from '../src/lib/supabaseKeys.js'

/**
 * GET /api/env-health
 *
 * Reports which environment variables the app needs, which one was picked up
 * and which are missing. It never returns a value or a secret — only the name
 * of the variable that satisfied each requirement.
 *
 * This answers "is any key missing in Vercel?" without guessing from a
 * screenshot.
 */

const GROQ_KEY_NAMES = ['GROQ_API_KEY', 'VITE_GROQ_API_KEY', 'GROQ_KEY']

function findFirst(env, names) {
  for (const name of names) {
    const value = env?.[name]
    if (typeof value === 'string' && value.trim()) return { name, value: value.trim() }
  }
  return { name: null, value: null }
}

function keyEntry(env, names, { validate = false } = {}) {
  const found = findFirst(env, names)
  if (!found.value) {
    return { configured: false, matched: null, acceptedNames: [...names] }
  }
  if (!validate) {
    return { configured: true, matched: found.name, acceptedNames: [...names] }
  }
  const inspected = inspectKey(found.value)
  return {
    configured: Boolean(inspected.key),
    matched: found.name,
    acceptedNames: [...names],
    problem: inspected.problem,
    shape: inspected.shape ?? null,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const env = process.env

  const required = {
    gemini: keyEntry(env, GEMINI_KEY_ENV_NAMES, { validate: true }),
    supabaseUrl: keyEntry(env, SUPABASE_URL_NAMES),
    supabaseAnonKey: keyEntry(env, SUPABASE_ANON_KEY_NAMES),
    supabaseServerKey: keyEntry(env, SUPABASE_SERVICE_KEY_NAMES),
    cronSecret: keyEntry(env, ['CRON_SECRET']),
  }

  const optional = {
    groq: keyEntry(env, GROQ_KEY_NAMES),
    openai: keyEntry(env, ['OPENAI_API_KEY']),
    tinyfish: keyEntry(env, ['TINYFISH_API_KEY']),
  }

  // Cross-check with the resolvers the app actually uses, so this endpoint
  // cannot drift from the runtime behaviour.
  const runtime = {
    geminiSource: (() => {
      const found = findFirst(env, GEMINI_KEY_ENV_NAMES)
      return found.name
    })(),
    supabaseUrlSource: getSupabaseUrl().name,
    supabaseServiceSource: getSupabaseServiceKey().name,
    supabaseAnonSource: getSupabaseAnonKey().name,
  }

  const missingRequired = Object.entries(required)
    .filter(([, entry]) => !entry.configured)
    .map(([name]) => name)

  const missingOptional = Object.entries(optional)
    .filter(([, entry]) => !entry.configured)
    .map(([name]) => name)

  const hints = []
  if (!required.gemini.configured) {
    hints.push(
      required.gemini.matched
        ? `${required.gemini.matched} is set but unusable (${required.gemini.problem}).`
        : 'Set GEMINI_API_KEY (https://aistudio.google.com/apikey) to enable vision analysis.'
    )
  }
  if (!required.supabaseServerKey.configured) {
    hints.push(
      `Add SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) — needed for threat-feed sync, blocklist writes and community reports. Accepted names: ${SUPABASE_SERVICE_KEY_NAMES.join(', ')}.`
    )
  }
  if (!required.cronSecret.configured) {
    hints.push(
      'Add CRON_SECRET so /api/cron/sync-feeds can authenticate Vercel Cron requests (it currently returns 401).'
    )
  }
  if (!required.supabaseAnonKey.configured) {
    hints.push('Add VITE_SUPABASE_ANON_KEY (public key) — the frontend cannot read the blocklist without it.')
  }
  if (!required.supabaseUrl.configured) {
    hints.push('Add VITE_SUPABASE_URL — no Supabase project URL was found.')
  }
  if (!optional.tinyfish.configured) {
    hints.push('Optional: TINYFISH_API_KEY enables live browser investigation.')
  }

  res.status(200).json({
    ok: missingRequired.length === 0,
    required,
    optional,
    runtime,
    missingRequired,
    missingOptional,
    hints,
    runtimeInfo: {
      vercelEnv: env.VERCEL_ENV || null,
      region: env.VERCEL_REGION || null,
      node: process.version,
    },
  })
}
