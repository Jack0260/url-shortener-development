'use client'

import { BarChart3 } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { RecentLink } from '@/lib/types'
import { cn } from '@/lib/utils'

function riskClass(score: number) {
  if (score >= 70) return 'bg-destructive'
  if (score >= 30) return 'bg-warning'
  return 'bg-success'
}

function status(link: RecentLink) {
  if (!link.expiresAt) return null
  const expired = new Date(link.expiresAt).getTime() <= Date.now()
  return expired ? 'Expired' : `Expires ${new Date(link.expiresAt).toLocaleDateString()}`
}

export function RecentLinks() {
  const { data, error, isLoading } = useSWR<RecentLink[]>('/api/links', fetcher)

  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
      <h2 id="recent-heading" className="text-sm font-medium text-muted-foreground">
        Recent links
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading && <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="px-4 py-6 text-sm text-destructive">Could not load recent links.</p>}
        {data && data.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No links yet. Shorten your first URL above.</p>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map((link) => {
              const note = status(link)
              return (
                <li key={link.code}>
                  <Link
                    href={`/stats/${link.code}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
                  >
                    <span
                      className={cn('size-2 shrink-0 rounded-full', riskClass(link.riskScore))}
                      title={`Risk score ${link.riskScore}`}
                    />
                    <span className="sr-only">{`Risk score ${link.riskScore}.`}</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-mono text-sm text-foreground">
                        /{link.code}
                        {link.isCustom && (
                          <span className="rounded bg-secondary px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-muted-foreground">
                            alias
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
                        <BarChart3 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        {link.clickCount}
                        <span className="sr-only">clicks</span>
                      </span>
                      {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
