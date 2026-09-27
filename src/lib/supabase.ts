import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resilientFetch } from './resilientFetch'
import {
  formatSupabaseNetworkError,
  getSupabaseApiKey,
  getSupabaseConfigError,
  getSupabaseDirectUrl,
  resolveSupabaseUrl,
} from './supabaseEnv'

const configError = getSupabaseConfigError()

if (configError) {
  throw new Error(configError)
}

const supabaseKey = getSupabaseApiKey()

function createSupabaseClient(): SupabaseClient {
  return createClient(resolveSupabaseUrl(), supabaseKey, {
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
}

export const supabase: SupabaseClient = createSupabaseClient()

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigError() === null
}

export function getSupabaseProjectHost(): string {
  try {
    return new URL(getSupabaseDirectUrl()).host
  } catch {
    return getSupabaseDirectUrl()
  }
}
