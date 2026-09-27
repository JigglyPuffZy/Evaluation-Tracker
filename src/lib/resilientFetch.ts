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

function isRetryableNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
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

/** Retry transient browser/network failures (e.g. ERR_QUIC_PROTOCOL_ERROR). */
export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxAttempts = 3,
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetch(input, init)
    } catch (error) {
      lastError = error
      if (attempt >= maxAttempts || !isRetryableNetworkError(error)) {
        break
      }
      await wait(250 * attempt)
    }
  }

  throw lastError
}
