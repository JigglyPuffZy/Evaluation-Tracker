import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resilientFetch } from './resilientFetch'
import {
  formatSupabaseNetworkError,
  getSupabaseApiKey,
  getSupabaseConfigError,
  getSupabaseUrl,
} from './supabaseEnv'

const configError = getSupabaseConfigError()

if (configError) {
  throw new Error(configError)
}

const supabaseUrl = getSupabaseUrl()
const supabaseKey = getSupabaseApiKey()

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (input, init) =>
      resilientFetch(input, init).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to fetch'
        throw new Error(formatSupabaseNetworkError(message))
      }),
  },
})

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigError() === null
}

export function getSupabaseProjectHost(): string {
  try {
    return new URL(supabaseUrl).host
  } catch {
    return supabaseUrl
  }
}
