import { describe, expect, it } from 'vitest'
import { codeFromId } from '@/lib/core/base62'
import { AliasTakenError, CodeExhaustedError, MaliciousUrlError, ValidationError } from '@/lib/core/errors'
import { createShortLink, resolveCode, type LinkRecord, type LinkRepository, type NewLink } from '@/lib/core/shortener'

class MemoryRepo implements LinkRepository {
  counter = 0
  rows = new Map<string, LinkRecord>()
  async nextId() {
    return ++this.counter
  }
  async insert(link: NewLink) {
    if (this.rows.has(link.code)) return false
    this.rows.set(link.code, { ...link, clickCount: 0, createdAt: new Date() })
    return true
  }
  async findByCode(code: string) {
    return this.rows.get(code) ?? null
  }
}

const now = new Date('2026-01-01T00:00:00Z')

describe('createShortLink', () => {
  it('creates a generated code from the counter', async () => {
    const repo = new MemoryRepo()
    const { link, risk } = await createShortLink(repo, { url: 'example.com' }, { now })
    expect(link.code).toBe(codeFromId(1))
    expect(link.url).toBe('https://example.com/')
    expect(link.isCustom).toBe(false)
    expect(link.clickCount).toBe(0)
    expect(link.createdAt).toBe(now)
    expect(risk.level).toBe('safe')
  })

  it('produces unique codes across many links', async () => {
    const repo = new MemoryRepo()
    const codes = new Set<string>()
    for (let i = 0; i < 500; i++) codes.add((await createShortLink(repo, { url: `https://e.com/${i}` })).link.code)
    expect(codes.size).toBe(500)
  })

  it('retries when a custom alias already took the generated code', async () => {
    const repo = new MemoryRepo()
    await createShortLink(repo, { url: 'https://a.com', alias: codeFromId(2) })
    const { link } = await createShortLink(repo, { url: 'https://b.com' })
    expect(link.code).toBe(codeFromId(3))
  })

  it('gives up after maxAttempts collisions', async () => {
    const repo = new MemoryRepo()
    repo.insert = async () => false
    await expect(createShortLink(repo, { url: 'https://a.com' }, { maxAttempts: 2 })).rejects.toBeInstanceOf(
      CodeExhaustedError,
    )
    expect(repo.counter).toBe(2)
  })

  it('supports custom aliases and rejects duplicates', async () => {
    const repo = new MemoryRepo()
    const { link } = await createShortLink(repo, { url: 'https://a.com', alias: 'launch' })
    expect(link).toMatchObject({ code: 'launch', isCustom: true })
    await expect(createShortLink(repo, { url: 'https://b.com', alias: 'launch' })).rejects.toBeInstanceOf(
      AliasTakenError,
    )
  })

  it('applies expiry', async () => {
    const { link } = await createShortLink(new MemoryRepo(), { url: 'https://a.com', expiresIn: '24h' }, { now })
    expect(link.expiresAt?.toISOString()).toBe('2026-01-02T00:00:00.000Z')
  })

  it('blocks malicious URLs before touching the repository', async () => {
    const repo = new MemoryRepo()
    const error = await createShortLink(repo, {
      url: 'http://paypal-secure-login.verify-account.xyz/signin?redirect=https://x.y',
    }).catch((e) => e)
    expect(error).toBeInstanceOf(MaliciousUrlError)
    expect(error.status).toBe(422)
    expect(error.details.level).toBe('dangerous')
    expect(repo.counter).toBe(0)
  })

  it('honours a custom block threshold', async () => {
    await expect(
      createShortLink(new MemoryRepo(), { url: 'http://example.com' }, { blockThreshold: 5 }),
    ).rejects.toBeInstanceOf(MaliciousUrlError)
  })

  it('validates input', async () => {
    await expect(createShortLink(new MemoryRepo(), {})).rejects.toBeInstanceOf(ValidationError)
    await expect(
      createShortLink(new MemoryRepo(), { url: 'https://sho.rt/x' }, { selfHost: 'sho.rt' }),
    ).rejects.toThrow(/back to this/)
  })
})

describe('resolveCode', () => {
  it('resolves active, expired and missing links', async () => {
    const repo = new MemoryRepo()
    await createShortLink(repo, { url: 'https://a.com', alias: 'live' }, { now })
    await createShortLink(repo, { url: 'https://a.com', alias: 'old', expiresIn: '1h' }, { now })

    expect((await resolveCode(repo, 'live', now)).status).toBe('ok')
    expect((await resolveCode(repo, 'old', now)).status).toBe('ok')
    expect((await resolveCode(repo, 'old', new Date('2026-01-01T02:00:00Z'))).status).toBe('expired')
    expect((await resolveCode(repo, 'nope', now)).status).toBe('not_found')
    expect((await resolveCode(repo, 'bad code!', now)).status).toBe('not_found')
  })

  it('defaults to the current time', async () => {
    const repo = new MemoryRepo()
    await createShortLink(repo, { url: 'https://a.com', alias: 'nowish' })
    expect((await resolveCode(repo, 'nowish')).status).toBe('ok')
  })
})
