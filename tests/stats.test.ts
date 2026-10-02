import { describe, expect, it } from 'vitest'
import { breakdown, buildStats, parseRange, rangeStart, type ClickRecord } from '@/lib/core/stats'

const now = new Date('2026-03-10T15:30:00Z')
const click = (iso: string, overrides: Partial<ClickRecord> = {}): ClickRecord => ({
  clickedAt: new Date(iso),
  device: 'desktop',
  browser: 'Chrome',
  os: 'macOS',
  referrer: 'direct',
  ...overrides,
})

describe('parseRange', () => {
  it('accepts known ranges and defaults to 7d', () => {
    expect(parseRange('24h')).toBe('24h')
    expect(parseRange('30d')).toBe('30d')
    expect(parseRange('1y')).toBe('7d')
    expect(parseRange(null)).toBe('7d')
  })
})

describe('rangeStart', () => {
  it('aligns to hour or day boundaries', () => {
    expect(rangeStart('24h', now).toISOString()).toBe('2026-03-09T16:00:00.000Z')
    expect(rangeStart('7d', now).toISOString()).toBe('2026-03-04T00:00:00.000Z')
  })
})

describe('breakdown', () => {
  it('counts, sorts and computes share', () => {
    expect(breakdown(['b', 'a', 'b', 'c', 'a', 'b'])).toEqual([
      { label: 'b', count: 3, share: 0.5 },
      { label: 'a', count: 2, share: 2 / 6 },
      { label: 'c', count: 1, share: 1 / 6 },
    ])
  })

  it('handles empty input and limits', () => {
    expect(breakdown([])).toEqual([])
    expect(breakdown(['a', 'b', 'c'], 2)).toHaveLength(2)
  })
})

describe('buildStats', () => {
  it('builds a daily timeline and breakdowns', () => {
    const stats = buildStats(
      [
        click('2026-03-10T09:00:00Z', { device: 'mobile', referrer: 'x.com' }),
        click('2026-03-10T09:30:00Z', { device: 'mobile', referrer: 'x.com' }),
        click('2026-03-04T00:00:00Z'),
        click('2026-03-01T00:00:00Z'),
        click('2026-03-11T00:00:00Z'),
      ],
      '7d',
      now,
    )
    expect(stats.granularity).toBe('day')
    expect(stats.total).toBe(3)
    expect(stats.timeline).toHaveLength(7)
    expect(stats.timeline[0]).toEqual({ bucket: '2026-03-04T00:00:00.000Z', clicks: 1 })
    expect(stats.timeline[6].clicks).toBe(2)
    expect(stats.devices[0]).toMatchObject({ label: 'mobile', count: 2 })
    expect(stats.referrers[0]).toMatchObject({ label: 'x.com', count: 2 })
    expect(stats.hourOfDay[9]).toBe(2)
  })

  it('builds an hourly timeline for 24h', () => {
    const stats = buildStats([click('2026-03-10T15:10:00Z'), click('2026-03-09T16:00:00Z')], '24h', now)
    expect(stats.granularity).toBe('hour')
    expect(stats.timeline).toHaveLength(24)
    expect(stats.timeline[0].clicks).toBe(1)
    expect(stats.timeline[23].clicks).toBe(1)
  })
})
