import { describe, expect, it } from 'vitest'
import { ValidationError } from '@/lib/core/errors'
import { normalizeUrl, parseExpiry, validateAlias } from '@/lib/core/validate'

const now = new Date('2026-01-01T00:00:00Z')

describe('normalizeUrl', () => {
  it('adds https when missing and normalizes', () => {
    expect(normalizeUrl('example.com/path')).toBe('https://example.com/path')
    expect(normalizeUrl('  HTTP://Example.com  ')).toBe('http://example.com/')
  })

  it('rejects empty, oversized and malformed input', () => {
    expect(() => normalizeUrl(undefined)).toThrow(ValidationError)
    expect(() => normalizeUrl('   ')).toThrow(ValidationError)
    expect(() => normalizeUrl(`https://e.com/${'a'.repeat(2100)}`)).toThrow(/under/)
    expect(() => normalizeUrl('https://exa mple.com')).toThrow(/valid URL/)
  })

  it('rejects dangerous and non-http schemes', () => {
    expect(() => normalizeUrl('javascript:alert(1)')).toThrow(/http and https/)
    expect(() => normalizeUrl('data:text/html,hi')).toThrow(/http and https/)
    expect(() => normalizeUrl('ftp://example.com')).toThrow(/http and https/)
  })

  it('rejects local and single-label hosts', () => {
    expect(() => normalizeUrl('http://localhost:3000')).toThrow(/public domain/)
    expect(() => normalizeUrl('http://intranet/')).toThrow(/public domain/)
    expect(normalizeUrl('http://[2001:db8::1]/')).toBe('http://[2001:db8::1]/')
  })

  it('rejects loops back to the shortener', () => {
    expect(() => normalizeUrl('https://sho.rt/abc', { selfHost: 'SHO.RT' })).toThrow(/back to this/)
  })
})

describe('validateAlias', () => {
  it('returns null when absent', () => {
    expect(validateAlias(undefined)).toBeNull()
    expect(validateAlias(null)).toBeNull()
    expect(validateAlias('  ')).toBeNull()
  })

  it('accepts valid aliases', () => {
    expect(validateAlias(' my-link_1 ')).toBe('my-link_1')
  })

  it('rejects invalid aliases', () => {
    expect(() => validateAlias(42)).toThrow(/string/)
    expect(() => validateAlias('ab')).toThrow(/3-32/)
    expect(() => validateAlias('has space')).toThrow(/3-32/)
    expect(() => validateAlias('API')).toThrow(/reserved/)
  })
})

describe('parseExpiry', () => {
  it('returns null for never', () => {
    for (const v of [undefined, null, '', 'never']) expect(parseExpiry(v, now)).toBeNull()
  })

  it('resolves presets', () => {
    expect(parseExpiry('1h', now)?.toISOString()).toBe('2026-01-01T01:00:00.000Z')
    expect(parseExpiry('30d', now)?.toISOString()).toBe('2026-01-31T00:00:00.000Z')
  })

  it('accepts future ISO dates', () => {
    expect(parseExpiry('2026-02-01T00:00:00Z', now)?.toISOString()).toBe('2026-02-01T00:00:00.000Z')
  })

  it('rejects bad dates', () => {
    expect(() => parseExpiry(5, now)).toThrow(/preset/)
    expect(() => parseExpiry('not-a-date', now)).toThrow(/valid date/)
    expect(() => parseExpiry('2025-01-01T00:00:00Z', now)).toThrow(/future/)
    expect(() => parseExpiry('2028-01-01T00:00:00Z', now)).toThrow(/year/)
  })
})
