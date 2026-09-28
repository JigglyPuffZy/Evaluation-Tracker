/** Single Supabase project for DOST Evaluation Tracker (must match vercel.json proxy). */
export const SUPABASE_PROJECT_REF = 'ljojasxfgqlnqswkfoqm'

/** Canonical URL — used when env vars point at the wrong/deleted project (e.g. old Vercel env). */
export const SUPABASE_CANONICAL_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`

/**
 * Canonical anon (public) key — safe in client code; RLS protects data.
 * Overrides wrong VITE_* values baked in from stale hosting env vars.
 */
export const SUPABASE_CANONICAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2phc3hmZ3FsbnFzd2tmb3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTMyNTQsImV4cCI6MjEwNTc2OTI1NH0.ZBqiw7v_Xpv638S1UZbHB7xSNnJQjXFh68fVUqsmZvI'

function readEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function getSupabaseDirectUrl(): string {
  const fromEnv = readEnv('VITE_SUPABASE_URL').replace(/\/+$/, '')
  if (getSupabaseProjectRefFromUrl(fromEnv) === SUPABASE_PROJECT_REF) {
    return fromEnv
  }
  return SUPABASE_CANONICAL_URL
}

/** @deprecated alias — use getSupabaseDirectUrl for the real Supabase host. */
export function getSupabaseUrl(): string {
  return getSupabaseDirectUrl()
}

export function isSupabaseProxyEnabled(): boolean {
  const flag = readEnv('VITE_SUPABASE_USE_PROXY')
  return flag === '' || flag === 'true' || flag === '1'
}

/** Browser URL for Supabase API — uses same-origin proxy to avoid Chrome QUIC errors. */
export function resolveSupabaseUrl(): string {
  const direct = getSupabaseDirectUrl()

  if (
    typeof window !== 'undefined' &&
    isSupabaseProxyEnabled() &&
    direct.length > 0
  ) {
    return `${window.location.origin}/api/supabase`
  }

  return direct
}

/** Anon key for this project — ignores env when it belongs to another Supabase project. */
export function getSupabaseApiKey(): string {
  const anon = readEnv('VITE_SUPABASE_ANON_KEY')
  if (anon.startsWith('eyJ') && getProjectRefFromJwt(anon) === SUPABASE_PROJECT_REF) {
    return anon
  }

  const publishable = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
  if (publishable.startsWith('sb_publishable_')) {
    return publishable
  }

  return SUPABASE_CANONICAL_ANON_KEY
}

export function getSupabaseProjectRefFromUrl(url = getSupabaseUrl()): string | null {
  const match = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i)
  return match?.[1]?.toLowerCase() ?? null
}

function getProjectRefFromJwt(jwt: string): string | null {
  try {
    const payloadPart = jwt.split('.')[1]
    if (!payloadPart) {
      return null
    }

    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as {
      ref?: string
    }

    return typeof payload.ref === 'string' ? payload.ref.toLowerCase() : null
  } catch {
    return null
  }
}

export function getSupabaseConfigError(): string | null {
  const url = getSupabaseDirectUrl()
  const key = getSupabaseApiKey()

  if (!url || !key) {
    return 'Supabase is not configured.'
  }

  if (getSupabaseProjectRefFromUrl(url) !== SUPABASE_PROJECT_REF) {
    return `Supabase URL must be ${SUPABASE_CANONICAL_URL}.`
  }

  if (getProjectRefFromJwt(key) !== SUPABASE_PROJECT_REF) {
    return `Supabase anon key must belong to project ${SUPABASE_PROJECT_REF}.`
  }

  return null
}

export function isSupabaseApiKeyError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('invalid api key') ||
    lower.includes('invalid jwt') ||
    lower.includes('invalid token') ||
    lower.includes('compactdecodeerror')
  )
}

export function isSupabaseNameResolutionError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('err_name_not_resolved') ||
    lower.includes('name not resolved') ||
    lower.includes('enotfound') ||
    lower.includes('non-existent domain')
  )
}

export function formatSupabaseNetworkError(message: string): string {
  const lower = message.toLowerCase()

  if (isSupabaseNameResolutionError(message)) {
    const configuredHost = getSupabaseProjectRefFromUrl()
    return [
      `Cannot resolve Supabase host${configuredHost ? ` "${configuredHost}.supabase.co"` : ''}.`,
      'That project URL does not exist (deleted, typo, or wrong env vars in Vercel/hosting).',
      'Fix: Supabase Dashboard → Settings → API → copy Project URL + anon/publishable key.',
      'Local: update .env then restart npm run dev. Deployed: update hosting env vars and redeploy.',
    ].join(' ')
  }

  if (lower.includes('quic') || lower.includes('err_quic')) {
    return [
      'Chrome blocked the Supabase connection (QUIC / HTTP3).',
      isSupabaseProxyEnabled()
        ? 'Proxy mode is on — restart npm run dev, hard refresh (Ctrl+Shift+R), and redeploy if this is the live site.'
        : 'Set VITE_SUPABASE_USE_PROXY=true in .env, restart npm run dev, and redeploy.',
      'If it still fails: turn off VPN, try Edge/Firefox, or disable QUIC in chrome://flags.',
    ].join(' ')
  }

  if (isSupabaseApiKeyError(message)) {
    const urlRef = getSupabaseProjectRefFromUrl()
    const jwtRef = getProjectRefFromJwt(readEnv('VITE_SUPABASE_ANON_KEY'))
    const mismatch =
      urlRef && jwtRef && urlRef !== jwtRef
        ? ` Env mismatch: URL is "${urlRef}" but anon key is for "${jwtRef}".`
        : isSupabaseProxyEnabled()
          ? ` Deployed builds often fail when Vercel still has the old project (fatvwpnqoexvdneevgof) while the proxy targets ${SUPABASE_PROJECT_REF}.`
          : ''

    return [
      `Invalid Supabase API key for project ${SUPABASE_PROJECT_REF}.${mismatch}`,
      `Set VITE_SUPABASE_URL=https://${SUPABASE_PROJECT_REF}.supabase.co`,
      'Set VITE_SUPABASE_ANON_KEY to the anon (public) key from that same project.',
      'Local: save .env → restart npm run dev. Vercel: Project Settings → Environment Variables → Redeploy.',
      'Then hard refresh (Ctrl+Shift+R) or clear site data.',
    ].join(' ')
  }

  if (message !== 'Failed to fetch' && !lower.includes('network') && !lower.includes('load failed')) {
    return message
  }

  return [
    'Cannot reach Supabase.',
    'Check your internet, confirm the project is not paused in the Supabase dashboard,',
    'verify VITE_SUPABASE_URL in .env, then restart npm run dev.',
    'If DevTools shows ERR_QUIC_PROTOCOL_ERROR, disable QUIC in Chrome (chrome://flags) or use another browser.',
  ].join(' ')
}

/** Wipe every Supabase auth token (use after invalid API key / project switch). */
export function clearAllSupabaseAuthStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  const keysToRemove: string[] = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (key && /^sb-.*-auth-token(?:\.\d+)?$/.test(key)) {
      keysToRemove.push(key)
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key)
  }
}

/** Remove cached auth tokens (stops refresh loops against wrong/deleted projects). */
export function clearSupabaseAuthStorage(currentRef = getSupabaseProjectRefFromUrl()): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  const keysToRemove: string[] = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key) {
      continue
    }

    const isSupabaseAuthKey = /^sb-.*-auth-token(?:\.\d+)?$/.test(key)
    if (!isSupabaseAuthKey) {
      continue
    }

    if (!currentRef || !key.startsWith(`sb-${currentRef}-`)) {
      keysToRemove.push(key)
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key)
  }
}
