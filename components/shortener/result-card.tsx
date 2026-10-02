'use client'

import { BarChart3, Check, Copy, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { CreatedLinkResponse } from '@/lib/types'

export function ResultCard({ link }: { link: CreatedLinkResponse }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(link.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section
      aria-label="Your short link"
      className="flex flex-col gap-5 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center"
    >
      <div className="shrink-0 self-center rounded-lg bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic SVG from our own API */}
        <img src={`/api/links/${link.code}/qr`} alt={`QR code for ${link.shortUrl}`} width={112} height={112} className="size-28" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Short link</p>
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate font-mono text-lg text-primary hover:underline"
          >
            {link.shortUrl.replace(/^https?:\/\//, '')}
          </a>
          <p className="mt-1 truncate text-sm text-muted-foreground" title={link.url}>
            {'→ '}
            {link.url}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {link.expiresAt ? `Expires ${new Date(link.expiresAt).toLocaleString()}` : 'Never expires'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" variant="outline" render={<a href={`/api/links/${link.code}/qr?format=png&size=1024`} download={`qr-${link.code}.png`} />}>
            <Download aria-hidden="true" />
            QR PNG
          </Button>
          <Button size="sm" variant="outline" render={<Link href={`/stats/${link.code}`} />}>
            <BarChart3 aria-hidden="true" />
            Analytics
          </Button>
          <Button size="sm" variant="ghost" render={<a href={link.shortUrl} target="_blank" rel="noopener noreferrer" />}>
            <ExternalLink aria-hidden="true" />
            Open
          </Button>
        </div>
      </div>
    </section>
  )
}
