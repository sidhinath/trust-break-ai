/**
 * Supabase configuration names, shared by the API routes and the cron script.
 *
 * Supabase has used several names for the same values over time, and the
 * Vercel dashboard shows whichever one the project was created with. Accepting
 * all of them avoids the classic "the key is right there in Vercel but the app
 * says it is missing" failure.
 */

/** Server-only secret. Never expose any of these to the browser. */
export const SUPABASE_SERVICE_KEY_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY', // legacy JWT service_role key
  'SUPABASE_SECRET_KEY', // current dashboard name (sb_secret_...)
  'SUPABASE_SERVICE_KEY', // used by some templates
  'SUPABASE_SERVICE_ROLE',
]

/** Project URL. */
export const SUPABASE_URL_NAMES = [
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_PROJECT_URL',
]

/** Public/anon key — safe for the browser. */
export const SUPABASE_ANON_KEY_NAMES = [
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPA_PUBLISHABLE_KEY',
]

function firstValue(env, names) {
  for (const name of names) {
    const value = env?.[name]
    if (typeof value === 'string' && value.trim()) {
      return { value: value.trim(), name }
    }
  }
  return { value: null, name: null }
}

export function getSupabaseUrl(env = process.env) {
  return firstValue(env, SUPABASE_URL_NAMES)
}

export function getSupabaseServiceKey(env = process.env) {
  return firstValue(env, SUPABASE_SERVICE_KEY_NAMES)
}

export function getSupabaseAnonKey(env = process.env) {
  return firstValue(env, SUPABASE_ANON_KEY_NAMES)
}
