import 'server-only'
import { buildStats, rangeStart, type StatRange } from '@/lib/core/stats'
import { getClicksSince, linkRepository } from '@/lib/db/repository'

export async function getLinkAnalytics(code: string, range: StatRange) {
  const link = await linkRepository.findByCode(code)
  if (!link) return null
  const now = new Date()
  const clickRows = await getClicksSince(link.id, rangeStart(range, now))
  const { id: _id, ...publicLink } = link
  return { link: publicLink, stats: buildStats(clickRows, range, now) }
}
