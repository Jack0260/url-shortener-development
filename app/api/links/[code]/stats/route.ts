import { NextResponse, type NextRequest } from 'next/server'
import { getLinkAnalytics } from '@/lib/analytics'
import { parseRange } from '@/lib/core/stats'
import { errorResponse } from '@/lib/http'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const analytics = await getLinkAnalytics(code, parseRange(request.nextUrl.searchParams.get('range')))
    if (!analytics) {
      return NextResponse.json({ error: { code: 'not_found', message: 'Link not found' } }, { status: 404 })
    }
    return NextResponse.json(analytics, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}
