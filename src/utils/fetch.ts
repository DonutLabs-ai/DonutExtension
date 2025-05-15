/**
 * Basic fetch with optional typing for response
 * This is the most basic version without timeout or retry
 */
export async function fetchBase<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': options.body ? 'application/json' : 'text/plain',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

/**
 * Fetch with timeout capability
 * @param url The URL to fetch from
 * @param options Standard fetch options
 * @param timeout Timeout in milliseconds (default: no timeout)
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout?: number
): Promise<T> {
  // If no timeout is specified, use basic fetch
  if (!timeout) {
    return fetchBase<T>(url, options);
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Add signal to options
    const fetchOptions = {
      ...options,
      signal: controller.signal,
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry and optional timeout capability
 * @param url The URL to fetch from
 * @param options Standard fetch options
 * @param config Configuration for timeout and retry behavior
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  config: {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const { timeout, maxRetries = 0, retryDelay = 1000 } = config;

  let retries = 0;
  let lastError: Error | null = null;

  // If no retries or timeout needed, use simpler fetch
  if (maxRetries === 0 && !timeout) {
    return fetchBase<T>(url, options);
  }

  // Create AbortController for timeout (if specified)
  const controller = new AbortController();
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  // Add signal to options if timeout specified
  const fetchOptions = timeout
    ? {
        ...options,
        signal: controller.signal,
      }
    : options;

  try {
    while (retries <= maxRetries) {
      try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error as Error;
        retries++;

        // If we've reached max retries or it's an abort error (timeout), throw
        if (
          retries > maxRetries ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          throw error;
        }

        // If it's a network error, wait before retrying
        const delay = retryDelay * Math.pow(2, retries - 1); // Exponential backoff
        console.warn(`[API] Retry ${retries}/${maxRetries} for ${url} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  // This should never happen due to the while loop condition, but TypeScript doesn't know that
  throw lastError || new Error('Unknown error during fetch');
}

/**
 * Type guard for PromiseFulfilledResult
 */
export function isFulfilled<T>(
  result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

/**
 * Type guard for PromiseRejectedResult
 */
export function isRejected<T>(result: PromiseSettledResult<T>): result is PromiseRejectedResult {
  return result.status === 'rejected';
}
