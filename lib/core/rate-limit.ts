export interface RateLimitStore {
  increment(key: string, windowStart: number): Promise<number>
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { windowStart: number; count: number }>()

  async increment(key: string, windowStart: number): Promise<number> {
    const bucket = this.buckets.get(key)
    if (!bucket || bucket.windowStart !== windowStart) {
      this.buckets.set(key, { windowStart, count: 1 })
      return 1
    }
    bucket.count += 1
    return bucket.count
  }
}

export function createRateLimiter(options: {
  limit: number
  windowMs: number
  store: RateLimitStore
  prefix: string
}) {
  const { limit, windowMs, store, prefix } = options
  return async function check(identifier: string, now = Date.now()): Promise<RateLimitResult> {
    const windowStart = Math.floor(now / windowMs) * windowMs
    const count = await store.increment(`${prefix}:${identifier}`, windowStart)
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: windowStart + windowMs,
    }
  }
}

export function rateLimitHeaders(result: RateLimitResult, now = Date.now()): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
  if (!result.allowed) headers['Retry-After'] = String(Math.max(1, Math.ceil((result.resetAt - now) / 1000)))
  return headers
}
