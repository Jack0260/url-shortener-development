export const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const BASE = BigInt(ALPHABET.length)

export const CODE_LENGTH = 7
export const CODE_SPACE = BASE ** BigInt(CODE_LENGTH)

// Multiplying by a constant coprime to 62^7 (= 2^7 * 31^7) is a bijection on
// [0, 62^7), so every counter value maps to a unique, non-sequential code.
const MULTIPLIER = 1_000_000_007n
const OFFSET = 1_234_567_890_123n

export function encodeBase62(value: bigint | number, minLength = 0): string {
  let n = BigInt(value)
  if (n < 0n) throw new RangeError('Cannot base62-encode a negative number')
  let out = ''
  do {
    out = ALPHABET[Number(n % BASE)] + out
    n /= BASE
  } while (n > 0n)
  return out.padStart(minLength, ALPHABET[0])
}

export function decodeBase62(input: string): bigint {
  if (input.length === 0) throw new RangeError('Cannot decode an empty string')
  let n = 0n
  for (const ch of input) {
    const digit = ALPHABET.indexOf(ch)
    if (digit === -1) throw new RangeError(`Invalid base62 character "${ch}"`)
    n = n * BASE + BigInt(digit)
  }
  return n
}

export function modInverse(a: bigint, m: bigint): bigint {
  let [oldR, r] = [((a % m) + m) % m, m]
  let [oldS, s] = [1n, 0n]
  while (r !== 0n) {
    const q = oldR / r
    ;[oldR, r] = [r, oldR - q * r]
    ;[oldS, s] = [s, oldS - q * s]
  }
  if (oldR !== 1n) throw new RangeError('Values are not coprime; no inverse exists')
  return ((oldS % m) + m) % m
}

const INVERSE = modInverse(MULTIPLIER, CODE_SPACE)

export function codeFromId(id: bigint | number): string {
  const n = BigInt(id)
  if (n < 1n || n >= CODE_SPACE) throw new RangeError(`Counter ${n} is outside the code space`)
  const scrambled = (n * MULTIPLIER + OFFSET) % CODE_SPACE
  return encodeBase62(scrambled, CODE_LENGTH)
}

export function idFromCode(code: string): bigint {
  if (code.length !== CODE_LENGTH) throw new RangeError(`Generated codes are ${CODE_LENGTH} characters`)
  const scrambled = decodeBase62(code)
  const shifted = (((scrambled - OFFSET) % CODE_SPACE) + CODE_SPACE) % CODE_SPACE
  return (shifted * INVERSE) % CODE_SPACE
}
