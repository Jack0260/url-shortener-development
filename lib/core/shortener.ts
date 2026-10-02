import { codeFromId } from './base62'
import { AliasTakenError, CodeExhaustedError, MaliciousUrlError } from './errors'
import { BLOCK_THRESHOLD, scoreUrl, type RiskReport } from './risk'
import { normalizeUrl, parseExpiry, validateAlias } from './validate'

export interface LinkRecord {
  id: number
  code: string
  url: string
  isCustom: boolean
  riskScore: number
  clickCount: number
  createdAt: Date
  expiresAt: Date | null
}

export type NewLink = Omit<LinkRecord, 'clickCount' | 'createdAt'>

export interface LinkRepository {
  nextId(): Promise<number>
  /** Returns false when the code already exists (unique constraint hit). */
  insert(link: NewLink): Promise<boolean>
  findByCode(code: string): Promise<LinkRecord | null>
}

export interface CreateLinkInput {
  url?: unknown
  alias?: unknown
  expiresIn?: unknown
}

export interface CreateLinkOptions {
  now?: Date
  selfHost?: string
  maxAttempts?: number
  blockThreshold?: number
}

export interface CreatedLink {
  link: LinkRecord
  risk: RiskReport
}

export async function createShortLink(
  repo: LinkRepository,
  input: CreateLinkInput,
  options: CreateLinkOptions = {},
): Promise<CreatedLink> {
  const now = options.now ?? new Date()
  const url = normalizeUrl(input.url, { selfHost: options.selfHost })
  const alias = validateAlias(input.alias)
  const expiresAt = parseExpiry(input.expiresIn, now)

  const risk = scoreUrl(url)
  if (risk.score >= (options.blockThreshold ?? BLOCK_THRESHOLD)) throw new MaliciousUrlError(risk)

  const build = (id: number, code: string, isCustom: boolean): NewLink => ({
    id, code, url, isCustom, riskScore: risk.score, expiresAt,
  })
  const finish = (link: NewLink): CreatedLink => ({ link: { ...link, clickCount: 0, createdAt: now }, risk })

  if (alias) {
    const link = build(await repo.nextId(), alias, true)
    if (!(await repo.insert(link))) throw new AliasTakenError(alias)
    return finish(link)
  }

  // Counter-derived codes are unique among themselves; a retry is only needed
  // when a custom alias has already claimed the same 7-character string.
  const maxAttempts = options.maxAttempts ?? 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const id = await repo.nextId()
    const link = build(id, codeFromId(id), false)
    if (await repo.insert(link)) return finish(link)
  }
  throw new CodeExhaustedError()
}

export type ResolveResult =
  | { status: 'ok'; link: LinkRecord }
  | { status: 'expired'; link: LinkRecord }
  | { status: 'not_found' }

const CODE_SHAPE = /^[A-Za-z0-9_-]{1,32}$/

export async function resolveCode(repo: LinkRepository, code: string, now = new Date()): Promise<ResolveResult> {
  if (!CODE_SHAPE.test(code)) return { status: 'not_found' }
  const link = await repo.findByCode(code)
  if (!link) return { status: 'not_found' }
  if (link.expiresAt && link.expiresAt.getTime() <= now.getTime()) return { status: 'expired', link }
  return { status: 'ok', link }
}
