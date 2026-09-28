function readEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function getSupabaseDirectUrl(): string {
  return readEnv('VITE_SUPABASE_URL').replace(/\/+$/, '')
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

/**
 * Prefer legacy anon JWT when it matches the project URL (most reliable for auth).
 * Fall back to publishable key, then anon even if refs differ (server will reject mismatches).
 */
export function getSupabaseApiKey(): string {
  const anon = readEnv('VITE_SUPABASE_ANON_KEY')
  const publishable = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
  const urlRef = getSupabaseProjectRefFromUrl()

  if (anon.startsWith('eyJ')) {
    const jwtRef = getProjectRefFromJwt(anon)
    if (urlRef && jwtRef === urlRef) {
      return anon
    }
  }

  if (publishable.startsWith('sb_publishable_')) {
    return publishable
  }

  return anon || publishable
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
  const anon = readEnv('VITE_SUPABASE_ANON_KEY')
  const publishable = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
  const key = getSupabaseApiKey()

  if (!url || !key) {
    return 'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to .env, then restart npm run dev.'
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    return `Invalid VITE_SUPABASE_URL: "${url}". Expected https://your-project.supabase.co`
  }

  const urlRef = getSupabaseProjectRefFromUrl(url)
  const jwtRef = getProjectRefFromJwt(readEnv('VITE_SUPABASE_ANON_KEY'))

  if (urlRef && jwtRef && urlRef !== jwtRef) {
    return [
      `Supabase env mismatch: VITE_SUPABASE_URL points to "${urlRef}"`,
      `but VITE_SUPABASE_ANON_KEY is for "${jwtRef}".`,
      'Copy URL and keys from the same project in Supabase → Settings → API, then redeploy.',
    ].join(' ')
  }

  if (!anon.startsWith('eyJ') && !publishable.startsWith('sb_publishable_')) {
    return [
      'Invalid Supabase API key format.',
      'Set VITE_SUPABASE_ANON_KEY (JWT starting with eyJ…) or VITE_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…)',
      'from Supabase Dashboard → Settings → API for the same project as VITE_SUPABASE_URL.',
    ].join(' ')
  }

  return null
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

  if (
    lower.includes('invalid api key') ||
    lower.includes('invalid jwt') ||
    lower.includes('invalid token') ||
    lower.includes('compactdecodeerror')
  ) {
    return [
      'Invalid Supabase API key for this project.',
      'Open Supabase Dashboard → Settings → API and copy Project URL + anon (public) key from the same project.',
      'Local: update .env, then restart npm run dev. Vercel: update env vars and redeploy.',
      'Remove stale keys or typos in VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY.',
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
