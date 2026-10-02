import { ValidationError } from './errors'

export const MAX_URL_LENGTH = 2048
export const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/
export const RESERVED_ALIASES = new Set([
  'api', 'stats', 'admin', '_next', 'static', 'favicon.ico', 'robots.txt',
  'sitemap.xml', 'login', 'logout', 'health', 'icon.svg',
])

export const EXPIRY_PRESETS = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
} as const

export type ExpiryPreset = keyof typeof EXPIRY_PRESETS
const MAX_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000
const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file|blob):/i
const HAS_SCHEME = /^[a-z][a-z\d+\-.]*:\/\//i

export function normalizeUrl(input: unknown, options: { selfHost?: string } = {}): string {
  if (typeof input !== 'string' || input.trim() === '') throw new ValidationError('A URL is required')
  const trimmed = input.trim()
  if (trimmed.length > MAX_URL_LENGTH) throw new ValidationError(`URLs must be under ${MAX_URL_LENGTH} characters`)
  if (BLOCKED_SCHEMES.test(trimmed)) throw new ValidationError('Only http and https URLs can be shortened')

  let url: URL
  try {
    url = new URL(HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    throw new ValidationError('That does not look like a valid URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ValidationError('Only http and https URLs can be shortened')
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || (!host.includes('.') && !host.startsWith('['))) {
    throw new ValidationError('The URL must point to a public domain')
  }
  if (options.selfHost && url.host.toLowerCase() === options.selfHost.toLowerCase()) {
    throw new ValidationError('Short links cannot point back to this shortener')
  }
  return url.toString()
}

export function validateAlias(input: unknown): string | null {
  if (input === undefined || input === null) return null
  if (typeof input !== 'string') throw new ValidationError('Alias must be a string')
  const alias = input.trim()
  if (alias === '') return null
  if (!ALIAS_PATTERN.test(alias)) {
    throw new ValidationError('Alias must be 3-32 characters: letters, numbers, "-" or "_"')
  }
  if (RESERVED_ALIASES.has(alias.toLowerCase())) throw new ValidationError(`"${alias}" is a reserved word`)
  return alias
}

export function parseExpiry(input: unknown, now: Date): Date | null {
  if (input === undefined || input === null || input === '' || input === 'never') return null
  if (typeof input !== 'string') throw new ValidationError('Expiry must be a preset or ISO date string')
  if (input in EXPIRY_PRESETS) return new Date(now.getTime() + EXPIRY_PRESETS[input as ExpiryPreset])

  const date = new Date(input)
  if (Number.isNaN(date.getTime())) throw new ValidationError('Expiry is not a valid date')
  if (date.getTime() <= now.getTime()) throw new ValidationError('Expiry must be in the future')
  if (date.getTime() - now.getTime() > MAX_EXPIRY_MS) throw new ValidationError('Expiry cannot be more than a year away')
  return date
}
