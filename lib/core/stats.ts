export interface ClickRecord {
  clickedAt: Date
  device: string
  browser: string
  os: string
  referrer: string
}

export interface BreakdownItem {
  label: string
  count: number
  share: number
}

export const STAT_RANGES = { '24h': 1, '7d': 7, '30d': 30 } as const
export type StatRange = keyof typeof STAT_RANGES

export interface LinkStats {
  range: StatRange
  granularity: 'hour' | 'day'
  total: number
  timeline: { bucket: string; clicks: number }[]
  devices: BreakdownItem[]
  browsers: BreakdownItem[]
  os: BreakdownItem[]
  referrers: BreakdownItem[]
  hourOfDay: number[]
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export function parseRange(input: unknown): StatRange {
  return typeof input === 'string' && input in STAT_RANGES ? (input as StatRange) : '7d'
}

export function rangeStart(range: StatRange, now: Date): Date {
  if (range === '24h') return new Date(Math.floor(now.getTime() / HOUR) * HOUR - 23 * HOUR)
  return new Date(Math.floor(now.getTime() / DAY) * DAY - (STAT_RANGES[range] - 1) * DAY)
}

export function breakdown(values: string[], limit = 6): BreakdownItem[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  const total = values.length
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, share: total === 0 ? 0 : count / total }))
}

export function buildStats(clicks: ClickRecord[], range: StatRange, now: Date): LinkStats {
  const granularity = range === '24h' ? 'hour' : 'day'
  const step = granularity === 'hour' ? HOUR : DAY
  const start = rangeStart(range, now).getTime()
  const bucketCount = range === '24h' ? 24 : STAT_RANGES[range]

  const inRange = clicks.filter((c) => c.clickedAt.getTime() >= start && c.clickedAt.getTime() <= now.getTime())
  const counts = new Array<number>(bucketCount).fill(0)
  const hourOfDay = new Array<number>(24).fill(0)
  for (const click of inRange) {
    const t = click.clickedAt.getTime()
    counts[Math.min(bucketCount - 1, Math.floor((t - start) / step))] += 1
    hourOfDay[click.clickedAt.getUTCHours()] += 1
  }

  return {
    range,
    granularity,
    total: inRange.length,
    timeline: counts.map((clicksInBucket, i) => ({
      bucket: new Date(start + i * step).toISOString(),
      clicks: clicksInBucket,
    })),
    devices: breakdown(inRange.map((c) => c.device)),
    browsers: breakdown(inRange.map((c) => c.browser)),
    os: breakdown(inRange.map((c) => c.os)),
    referrers: breakdown(inRange.map((c) => c.referrer)),
    hourOfDay,
  }
}
