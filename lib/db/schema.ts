import { bigint, bigserial, boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const links = pgTable('links', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  code: text('code').notNull().unique(),
  url: text('url').notNull(),
  isCustom: boolean('is_custom').notNull().default(false),
  riskScore: integer('risk_score').notNull().default(0),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
})

export const clicks = pgTable('clicks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  linkId: bigint('link_id', { mode: 'number' }).notNull(),
  clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull().defaultNow(),
  device: text('device').notNull(),
  browser: text('browser').notNull(),
  os: text('os').notNull(),
  referrer: text('referrer').notNull(),
})

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  count: integer('count').notNull(),
})
