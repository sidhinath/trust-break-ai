import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY')
}

let activeToken = null

export const supabase = createClient(supabaseUrl || 'https://ghostnet-demo.supabase.co', supabaseAnonKey || 'anon_key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers || {})
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`)
      }
      return fetch(url, { ...options, headers })
    },
  },
})

export async function updateSupabaseAuthToken(token) {
  activeToken = token
}
