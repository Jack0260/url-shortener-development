import 'server-only'
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm'
import type { RateLimitStore } from '@/lib/core/rate-limit'
import type { LinkRepository } from '@/lib/core/shortener'
import type { ClickInfo } from '@/lib/types'
import { db } from './index'
import { clicks, links } from './schema'

export const linkRepository: LinkRepository = {
  async nextId() {
    const result = await db.execute<{ id: string }>(sql`select nextval('links_id_seq') as id`)
    return Number(result.rows[0].id)
  },
  async insert(link) {
    const rows = await db
      .insert(links)
      .values(link)
      .onConflictDoNothing({ target: links.code })
      .returning({ id: links.id })
    return rows.length > 0
  },
  async findByCode(code) {
    const [row] = await db.select().from(links).where(eq(links.code, code)).limit(1)
    return row ?? null
  },
}

export async function recordClick(linkId: number, info: ClickInfo) {
  await db.insert(clicks).values({ linkId, ...info })
  await db
    .update(links)
    .set({ clickCount: sql`${links.clickCount} + 1` })
    .where(eq(links.id, linkId))
}

export async function listRecentLinks(limit = 12) {
  return db
    .select({
      code: links.code,
      url: links.url,
      isCustom: links.isCustom,
      riskScore: links.riskScore,
      clickCount: links.clickCount,
      createdAt: links.createdAt,
      expiresAt: links.expiresAt,
    })
    .from(links)
    .orderBy(desc(links.createdAt))
    .limit(limit)
}

export async function getClicksSince(linkId: number, since: Date) {
  return db
    .select({
      clickedAt: clicks.clickedAt,
      device: clicks.device,
      browser: clicks.browser,
      os: clicks.os,
      referrer: clicks.referrer,
    })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), gte(clicks.clickedAt, since)))
    .orderBy(asc(clicks.clickedAt))
    .limit(50_000)
}

export const postgresRateLimitStore: RateLimitStore = {
  async increment(key, windowStart) {
    const start = new Date(windowStart).toISOString()
    const result = await db.execute<{ count: number }>(sql`
      insert into rate_limits (key, window_start, count)
      values (${key}, ${start}::timestamptz, 1)
      on conflict (key) do update set
        count = case when rate_limits.window_start < excluded.window_start then 1 else rate_limits.count + 1 end,
        window_start = greatest(rate_limits.window_start, excluded.window_start)
      returning count
    `)
    return Number(result.rows[0].count)
  },
}
