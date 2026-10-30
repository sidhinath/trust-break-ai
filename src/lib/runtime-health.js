export function assertRequiredEnv() {
  const missing = []

  if (!import.meta.env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')

  if (missing.length > 0) {
    console.warn(`[GhostNet Runtime] Missing environment variables: ${missing.join(', ')}. Operating in local offline mode.`)
  }
}
