import { describe, expect, it } from 'vitest'
import { createRateLimiter, MemoryRateLimitStore, rateLimitHeaders } from '@/lib/core/rate-limit'

describe('createRateLimiter', () => {
  const make = () => createRateLimiter({ limit: 3, windowMs: 60_000, store: new MemoryRateLimitStore(), prefix: 't' })

  it('allows up to the limit then blocks', async () => {
    const check = make()
    const now = 1_000_000
    const results = []
    for (let i = 0; i < 4; i++) results.push(await check('1.1.1.1', now))
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false])
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0])
  })

  it('resets in the next window', async () => {
    const check = make()
    for (let i = 0; i < 4; i++) await check('ip', 0)
    const next = await check('ip', 60_000)
    expect(next.allowed).toBe(true)
    expect(next.resetAt).toBe(120_000)
  })

  it('tracks identifiers independently', async () => {
    const check = make()
    for (let i = 0; i < 3; i++) await check('a', 0)
    expect((await check('a', 0)).allowed).toBe(false)
    expect((await check('b', 0)).allowed).toBe(true)
  })
})

describe('rateLimitHeaders', () => {
  it('emits standard headers', () => {
    const headers = rateLimitHeaders({ allowed: true, limit: 10, remaining: 9, resetAt: 60_000 }, 0)
    expect(headers).toEqual({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '9',
      'X-RateLimit-Reset': '60',
    })
  })

  it('adds Retry-After when blocked', () => {
    const headers = rateLimitHeaders({ allowed: false, limit: 10, remaining: 0, resetAt: 60_000 }, 30_500)
    expect(headers['Retry-After']).toBe('30')
    expect(rateLimitHeaders({ allowed: false, limit: 1, remaining: 0, resetAt: 1000 }, 1000)['Retry-After']).toBe('1')
  })
})
