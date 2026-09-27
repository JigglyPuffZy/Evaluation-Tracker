function readEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function getSupabaseUrl(): string {
  return readEnv('VITE_SUPABASE_URL').replace(/\/+$/, '')
}

/** Prefer publishable key (new Supabase projects); fall back to legacy anon JWT. */
export function getSupabaseApiKey(): string {
  return readEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || readEnv('VITE_SUPABASE_ANON_KEY')
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
  const url = getSupabaseUrl()
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
      'Browser network error (QUIC / HTTP3). Supabase is up, but Chrome failed the connection.',
      'Try: hard refresh (Ctrl+Shift+R), turn off VPN, or disable QUIC in Chrome at chrome://flags (#enable-quic → Disabled), then restart the browser.',
      'You can also try Edge or Firefox.',
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
