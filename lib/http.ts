import 'server-only'
import { NextResponse } from 'next/server'
import { AppError } from '@/lib/core/errors'
import { createRateLimiter, rateLimitHeaders, type RateLimitResult } from '@/lib/core/rate-limit'
import { postgresRateLimitStore } from '@/lib/db/repository'

export const createLinkLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
  store: postgresRateLimitStore,
  prefix: 'create',
})

export const riskCheckLimiter = createRateLimiter({
  limit: 60,
  windowMs: 60_000,
  store: postgresRateLimitStore,
  prefix: 'check',
})

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}

export function getOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return new URL(request.url).origin
  const proto = request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export function rateLimitedResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: { code: 'rate_limited', message: 'Too many requests. Please slow down and try again shortly.' } },
    { status: 429, headers: rateLimitHeaders(result) },
  )
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    )
  }
  console.error('[shortener] unexpected error', error)
  return NextResponse.json({ error: { code: 'internal', message: 'Something went wrong' } }, { status: 500 })
}
