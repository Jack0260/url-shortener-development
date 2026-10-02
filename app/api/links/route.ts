import { NextResponse } from 'next/server'
import { rateLimitHeaders } from '@/lib/core/rate-limit'
import { createShortLink, type CreateLinkInput } from '@/lib/core/shortener'
import { ValidationError } from '@/lib/core/errors'
import { linkRepository, listRecentLinks } from '@/lib/db/repository'
import { createLinkLimiter, errorResponse, getClientIp, getOrigin, rateLimitedResponse } from '@/lib/http'
import type { CreatedLinkResponse } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const limit = await createLinkLimiter(getClientIp(request.headers))
    if (!limit.allowed) return rateLimitedResponse(limit)

    const body: unknown = await request.json().catch(() => {
      throw new ValidationError('Request body must be JSON')
    })
    if (typeof body !== 'object' || body === null) throw new ValidationError('Request body must be an object')

    const origin = getOrigin(request)
    const { link, risk } = await createShortLink(linkRepository, body as CreateLinkInput, {
      selfHost: new URL(origin).host,
    })

    const payload: CreatedLinkResponse = {
      code: link.code,
      shortUrl: `${origin}/${link.code}`,
      url: link.url,
      isCustom: link.isCustom,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      createdAt: link.createdAt.toISOString(),
      risk,
    }
    return NextResponse.json(payload, { status: 201, headers: rateLimitHeaders(limit) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET() {
  try {
    const rows = await listRecentLinks()
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}
