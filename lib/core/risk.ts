export type RiskLevel = 'safe' | 'suspicious' | 'dangerous'

export interface RiskSignal {
  id: string
  label: string
  points: number
}

export interface RiskReport {
  score: number
  level: RiskLevel
  signals: RiskSignal[]
}

export const SUSPICIOUS_THRESHOLD = 30
export const BLOCK_THRESHOLD = 70

const SUSPICIOUS_TLDS = new Set([
  'zip', 'mov', 'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'click',
  'country', 'kim', 'work', 'rest', 'support', 'loan', 'cam', 'icu',
])

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'cutt.ly', 'rebrand.ly', 'shorturl.at',
])

const PHISHING_KEYWORDS = [
  'login', 'signin', 'verify', 'account', 'secure', 'update', 'banking',
  'wallet', 'password', 'confirm', 'suspend', 'unlock', 'billing',
  'invoice', 'prize', 'bonus', 'giveaway',
]

const BRANDS = [
  'paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix', 'facebook',
  'instagram', 'whatsapp', 'coinbase', 'binance', 'chase', 'wellsfargo',
  'dropbox', 'docusign', 'office365', 'outlook',
]

const SECOND_LEVEL_SUFFIXES = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu'])
const EXECUTABLE_PATH = /\.(exe|scr|msi|bat|cmd|ps1|vbs|apk|jar|dmg|iso|hta)$/i
const EMBEDDED_REDIRECT = /[?&][^=&]*(redirect|url|next|goto|dest)[^=&]*=https?(:|%3a)/i
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

export function registrableDomain(host: string): string {
  const labels = host.split('.')
  if (labels.length <= 2) return host
  const tld = labels[labels.length - 1]
  const sld = labels[labels.length - 2]
  const take = SECOND_LEVEL_SUFFIXES.has(sld) && tld.length === 2 ? 3 : 2
  return labels.slice(-take).join('.')
}

export function levelForScore(score: number): RiskLevel {
  if (score >= BLOCK_THRESHOLD) return 'dangerous'
  if (score >= SUSPICIOUS_THRESHOLD) return 'suspicious'
  return 'safe'
}

export function scoreUrl(rawUrl: string): RiskReport {
  const url = new URL(rawUrl)
  const host = url.hostname.toLowerCase()
  const signals: RiskSignal[] = []
  const add = (id: string, label: string, points: number) => signals.push({ id, label, points })

  const isIp = IPV4.test(host) || host.startsWith('[')
  const labels = host.split('.')
  const tld = labels[labels.length - 1]
  const base = isIp ? host : registrableDomain(host)

  if (url.protocol !== 'https:') add('no-https', 'Not using HTTPS', 10)
  if (isIp) add('ip-host', 'Raw IP address instead of a domain', 25)
  if (url.username || url.password) add('userinfo', 'Hidden credentials ("@" trick) in URL', 25)
  if (labels.some((label) => label.startsWith('xn--'))) {
    add('punycode', 'Punycode domain (possible look-alike characters)', 20)
  }
  if (!isIp && SUSPICIOUS_TLDS.has(tld)) add('tld', `High-abuse TLD .${tld}`, 15)
  if (!isIp && labels.length > 4) add('subdomains', 'Excessive subdomain depth', 10)
  if ((host.match(/-/g)?.length ?? 0) >= 3) add('hyphens', 'Many hyphens in domain', 10)
  if (host.length > 30) add('long-host', 'Unusually long domain', 5)
  if (rawUrl.length > 120) add('long-url', 'Very long URL', 5)
  if (url.port) add('port', `Non-standard port :${url.port}`, 10)
  if (SHORTENERS.has(base)) add('nested-shortener', 'Points to another URL shortener', 15)

  const hostTokens = host.split(/[.-]/)
  const baseLabel = base.split('.')[0]
  const brand = BRANDS.find((b) => hostTokens.includes(b) && baseLabel !== b)
  if (brand) add('brand', `Mentions "${brand}" but is not ${brand}'s domain`, 30)

  const haystack = `${host}${url.pathname}${url.search}`.toLowerCase()
  const keywordHits = PHISHING_KEYWORDS.filter((k) => haystack.includes(k))
  if (keywordHits.length > 0) {
    add('keywords', `Phishing keywords: ${keywordHits.slice(0, 4).join(', ')}`, Math.min(keywordHits.length * 5, 20))
  }

  if (EXECUTABLE_PATH.test(url.pathname)) add('executable', 'Links directly to an executable download', 20)
  if ((rawUrl.match(/%[0-9a-f]{2}/gi)?.length ?? 0) >= 5) add('encoding', 'Heavy percent-encoding', 10)
  if (EMBEDDED_REDIRECT.test(url.search)) add('open-redirect', 'Embeds a redirect to another URL', 10)
  if (!isIp && host.replace(/\D/g, '').length >= 5) add('digits', 'Many digits in domain', 5)

  const score = Math.min(100, signals.reduce((sum, s) => sum + s.points, 0))
  return { score, level: levelForScore(score), signals }
}
