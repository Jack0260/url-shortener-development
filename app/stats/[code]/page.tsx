import { ArrowLeft, Download } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { BreakdownList } from '@/components/stats/breakdown-list'
import { HourStrip } from '@/components/stats/hour-strip'
import { TimelineChart } from '@/components/stats/timeline-chart'
import { getLinkAnalytics } from '@/lib/analytics'
import { parseRange, STAT_RANGES } from '@/lib/core/stats'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Link analytics — snip' }

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ range?: string }>
}) {
  const [{ code }, { range: rawRange }, headerList] = await Promise.all([params, searchParams, headers()])
  const range = parseRange(rawRange)
  const analytics = await getLinkAnalytics(code, range)
  if (!analytics) notFound()

  const { link, stats } = analytics
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? ''
  const expired = link.expiresAt !== null && link.expiresAt.getTime() <= Date.now()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <Link href="/" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0 self-start rounded-lg bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic SVG from our own API */}
            <img src={`/api/links/${link.code}/qr`} alt={`QR code for /${link.code}`} width={96} height={96} className="size-24" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="truncate font-mono text-2xl font-semibold">
              {host}/{link.code}
            </h1>
            <p className="truncate text-sm text-muted-foreground" title={link.url}>
              {'→ '}
              {link.url}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Created {link.createdAt.toLocaleDateString()}</span>
              <span className={cn(expired && 'text-destructive')}>
                {link.expiresAt ? `${expired ? 'Expired' : 'Expires'} ${link.expiresAt.toLocaleString()}` : 'Never expires'}
              </span>
              <span>Risk {link.riskScore}/100</span>
              <a href={`/api/links/${link.code}/qr?format=png&size=1024`} download className="flex items-center gap-1 hover:text-foreground">
                <Download className="size-3.5" aria-hidden="true" />
                QR PNG
              </a>
            </div>
          </div>
        </div>

        <section aria-labelledby="clicks-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="clicks-heading" className="text-sm text-muted-foreground">
                Clicks in range
              </h2>
              <p className="font-mono text-3xl font-semibold tabular-nums">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{link.clickCount} all-time</p>
            </div>
            <nav aria-label="Time range" className="flex rounded-lg border border-border p-0.5">
              {Object.keys(STAT_RANGES).map((key) => (
                <Link
                  key={key}
                  href={`/stats/${link.code}?range=${key}`}
                  aria-current={key === range ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-1 font-mono text-xs transition-colors',
                    key === range ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {key}
                </Link>
              ))}
            </nav>
          </div>
          <TimelineChart data={stats.timeline} granularity={stats.granularity} />
        </section>

        <HourStrip hours={stats.hourOfDay} />

        <div className="grid gap-4 sm:grid-cols-2">
          <BreakdownList title="Devices" items={stats.devices} />
          <BreakdownList title="Referrers" items={stats.referrers} />
          <BreakdownList title="Browsers" items={stats.browsers} />
          <BreakdownList title="Operating systems" items={stats.os} />
        </div>
      </main>
    </>
  )
}
