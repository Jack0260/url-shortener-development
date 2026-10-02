import { describe, expect, it } from 'vitest'
import {
  CODE_LENGTH,
  CODE_SPACE,
  codeFromId,
  decodeBase62,
  encodeBase62,
  idFromCode,
  modInverse,
} from '@/lib/core/base62'

describe('base62 encoding', () => {
  it('encodes known values', () => {
    expect(encodeBase62(0)).toBe('0')
    expect(encodeBase62(61)).toBe('z')
    expect(encodeBase62(62)).toBe('10')
    expect(encodeBase62(3843)).toBe('zz')
  })

  it('pads to a minimum length', () => {
    expect(encodeBase62(1, 4)).toBe('0001')
  })

  it('round-trips arbitrary values', () => {
    for (const n of [0n, 1n, 61n, 62n, 999_999n, 2n ** 50n]) {
      expect(decodeBase62(encodeBase62(n))).toBe(n)
    }
  })

  it('rejects invalid input', () => {
    expect(() => encodeBase62(-1)).toThrow(RangeError)
    expect(() => decodeBase62('')).toThrow(RangeError)
    expect(() => decodeBase62('ab!')).toThrow(/Invalid base62/)
  })
})

describe('modInverse', () => {
  it('computes a modular inverse', () => {
    expect(modInverse(3n, 11n)).toBe(4n)
    expect((modInverse(17n, 3120n) * 17n) % 3120n).toBe(1n)
  })

  it('throws when no inverse exists', () => {
    expect(() => modInverse(4n, 8n)).toThrow(/coprime/)
  })
})

describe('counter-derived codes', () => {
  it('produces fixed-length codes', () => {
    expect(codeFromId(1)).toHaveLength(CODE_LENGTH)
    expect(codeFromId(CODE_SPACE - 1n)).toHaveLength(CODE_LENGTH)
  })

  it('is collision-free for a large run of counters', () => {
    const seen = new Set<string>()
    for (let id = 1; id <= 100_000; id++) seen.add(codeFromId(id))
    expect(seen.size).toBe(100_000)
  })

  it('does not look sequential', () => {
    expect(codeFromId(1).slice(0, 4)).not.toBe(codeFromId(2).slice(0, 4))
  })

  it('is reversible', () => {
    for (const id of [1n, 2n, 12_345n, 987_654_321n, CODE_SPACE - 1n]) {
      expect(idFromCode(codeFromId(id))).toBe(id)
    }
  })

  it('rejects counters outside the code space', () => {
    expect(() => codeFromId(0)).toThrow(RangeError)
    expect(() => codeFromId(CODE_SPACE)).toThrow(RangeError)
    expect(() => idFromCode('abc')).toThrow(RangeError)
  })
})
