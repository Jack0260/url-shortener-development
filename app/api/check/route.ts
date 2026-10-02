import { NextResponse, type NextRequest } from 'next/server'
import { rateLimitHeaders } from '@/lib/core/rate-limit'
import { BLOCK_THRESHOLD, scoreUrl } from '@/lib/core/risk'
import { normalizeUrl } from '@/lib/core/validate'
import { errorResponse, getClientIp, rateLimitedResponse, riskCheckLimiter } from '@/lib/http'
import type { RiskCheckResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const limit = await riskCheckLimiter(getClientIp(request.headers))
    if (!limit.allowed) return rateLimitedResponse(limit)

    const url = normalizeUrl(request.nextUrl.searchParams.get('url'))
    const risk = scoreUrl(url)
    const payload: RiskCheckResponse = { url, ...risk, blocked: risk.score >= BLOCK_THRESHOLD }
    return NextResponse.json(payload, { headers: rateLimitHeaders(limit) })
  } catch (error) {
    return errorResponse(error)
  }
}
