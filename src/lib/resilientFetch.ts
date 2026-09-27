const RETRYABLE_PATTERNS = [
  'failed to fetch',
  'network',
  'quic',
  'load failed',
  'networkerror',
  'aborted',
  'timeout',
]

const NON_RETRYABLE_PATTERNS = [
  'err_name_not_resolved',
  'name not resolved',
  'enotfound',
  'non-existent domain',
]

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isRetryableNetworkError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase()
  if (NON_RETRYABLE_PATTERNS.some((pattern) => message.includes(pattern))) {
    return false
  }
  return RETRYABLE_PATTERNS.some((pattern) => message.includes(pattern))
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof URL) {
    return input.href
  }
  return input.url
}

function parseResponseHeaders(raw: string): Headers {
  const headers = new Headers()
  for (const line of raw.trim().split(/[\r\n]+/)) {
    if (!line || line.startsWith('HTTP/')) {
      continue
    }
    const separator = line.indexOf(':')
    if (separator === -1) {
      continue
    }
    const name = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    if (name) {
      headers.append(name, value)
    }
  }
  return headers
}

function applyRequestHeaders(xhr: XMLHttpRequest, init?: RequestInit): void {
  if (!init?.headers) {
    return
  }

  const headers = new Headers(init.headers)
  headers.forEach((value, key) => {
    xhr.setRequestHeader(key, value)
  })
}

/** Fallback when fetch() fails — sometimes succeeds when Chrome QUIC is flaky. */
function xhrFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = resolveRequestUrl(input)
  const method = init?.method ?? 'GET'

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url, true)
    applyRequestHeaders(xhr, init)
    xhr.responseType = 'arraybuffer'

    xhr.onload = () => {
      resolve(
        new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseResponseHeaders(xhr.getAllResponseHeaders()),
        }),
      )
    }

    xhr.onerror = () => reject(new TypeError('Failed to fetch'))
    xhr.onabort = () => reject(new TypeError('Failed to fetch'))
    xhr.ontimeout = () => reject(new TypeError('Failed to fetch'))

    xhr.send((init?.body as XMLHttpRequestBodyInit | null | undefined) ?? null)
  })
}

async function attemptFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Connection')) {
    headers.set('Connection', 'close')
  }

  return fetch(input, {
    ...init,
    headers,
    cache: init?.cache ?? 'no-store',
  })
}

/** Retry transient browser/network failures (e.g. ERR_QUIC_PROTOCOL_ERROR). */
export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxAttempts = 5,
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await attemptFetch(input, init)
    } catch (error) {
      lastError = error

      if (attempt >= maxAttempts || !isRetryableNetworkError(error)) {
        break
      }

      await wait(300 * attempt)
    }
  }

  try {
    return await xhrFetch(input, init)
  } catch (xhrError) {
    throw lastError ?? xhrError
  }
}
