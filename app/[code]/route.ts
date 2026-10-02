import { after, NextResponse } from 'next/server'
import { resolveCode } from '@/lib/core/shortener'
import { parseReferrer, parseUserAgent } from '@/lib/core/user-agent'
import { linkRepository, recordClick } from '@/lib/db/repository'
import { getOrigin } from '@/lib/http'

function unavailable(status: 404 | 410, title: string, message: string) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:ui-sans-serif,system-ui,sans-serif;background:#0a0a0a;color:#fafafa}main{max-width:28rem;padding:2rem;text-align:center}p{color:#a3a3a3;line-height:1.6}a{color:#7aa2ff}</style></head><body><main><h1>${title}</h1><p>${message}</p><p><a href="/">Create a new short link</a></p></main></body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const result = await resolveCode(linkRepository, code)

  if (result.status === 'not_found') {
    return unavailable(404, 'Link not found', 'This short link does not exist.')
  }
  if (result.status === 'expired') {
    return unavailable(410, 'Link expired', 'This short link has expired and no longer redirects.')
  }

  const selfHost = new URL(getOrigin(request)).host
  const client = parseUserAgent(request.headers.get('user-agent'))
  const referrer = parseReferrer(request.headers.get('referer'), selfHost)
  const linkId = result.link.id

  after(async () => {
    try {
      await recordClick(linkId, { ...client, referrer })
    } catch (error) {
      console.error('[shortener] failed to record click', error)
    }
  })

  const response = NextResponse.redirect(result.link.url, 302)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
