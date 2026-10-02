import { NextResponse, type NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { linkRepository } from '@/lib/db/repository'
import { errorResponse, getOrigin } from '@/lib/http'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const link = await linkRepository.findByCode(code)
    if (!link) return NextResponse.json({ error: { code: 'not_found', message: 'Link not found' } }, { status: 404 })

    const shortUrl = `${getOrigin(request)}/${link.code}`
    const format = request.nextUrl.searchParams.get('format') === 'png' ? 'png' : 'svg'
    const size = Math.min(1024, Math.max(128, Number(request.nextUrl.searchParams.get('size')) || 512))
    const options = { margin: 1, errorCorrectionLevel: 'M' as const, width: size }
    const cache = { 'Cache-Control': 'public, max-age=86400, immutable' }

    if (format === 'png') {
      const png = await QRCode.toBuffer(shortUrl, { ...options, type: 'png' })
      return new NextResponse(new Uint8Array(png), {
        headers: {
          ...cache,
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="qr-${link.code}.png"`,
        },
      })
    }
    const svg = await QRCode.toString(shortUrl, { ...options, type: 'svg' })
    return new NextResponse(svg, { headers: { ...cache, 'Content-Type': 'image/svg+xml' } })
  } catch (error) {
    return errorResponse(error)
  }
}
