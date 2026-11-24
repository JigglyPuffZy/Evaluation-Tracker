import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resilientFetch } from './resilientFetch'
import {
  formatSupabaseNetworkError,
  getSupabaseApiKey,
  getSupabaseConfigError,
  resolveSupabaseUrl,
  SUPABASE_PROJECT_REF,
} from './supabaseEnv'

const configError = getSupabaseConfigError()

if (configError) {
  throw new Error(configError)
}

const supabaseKey = getSupabaseApiKey()

function createSupabaseClient(): SupabaseClient {
  return createClient(resolveSupabaseUrl(), supabaseKey, {
    auth: {
      // Pin the key to the project ref. Without this, proxy mode derives it from the page host
      // (e.g. sb-localhost-auth-token), which clearSupabaseAuthStorage() deletes on every load.
      storageKey: `sb-${SUPABASE_PROJECT_REF}-auth-token`,
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
