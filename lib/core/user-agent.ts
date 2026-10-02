export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown'

export interface ClientInfo {
  device: DeviceType
  browser: string
  os: string
}

const BOT = /bot|crawler|spider|crawl|slurp|curl|wget|python-requests|httpclient|headless|facebookexternalhit|preview/i
const TABLET = /ipad|tablet|kindle|silk|playbook/i
const MOBILE = /mobi|iphone|ipod|windows phone/i

function detectOs(ua: string): string {
  if (/windows phone/i.test(ua)) return 'Windows Phone'
  if (/windows/i.test(ua)) return 'Windows'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  if (/cros/i.test(ua)) return 'ChromeOS'
  if (/mac os x|macintosh/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Other'
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Other'
}

function detectDevice(ua: string): DeviceType {
  if (BOT.test(ua)) return 'bot'
  if (TABLET.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return 'tablet'
  if (MOBILE.test(ua)) return 'mobile'
  return 'desktop'
}

export function parseUserAgent(ua: string | null | undefined): ClientInfo {
  if (!ua) return { device: 'unknown', browser: 'Unknown', os: 'Unknown' }
  const device = detectDevice(ua)
  return { device, browser: device === 'bot' ? 'Bot' : detectBrowser(ua), os: detectOs(ua) }
}

export function parseReferrer(referrer: string | null | undefined, selfHost?: string): string {
  if (!referrer) return 'direct'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    const self = selfHost?.split(':')[0].replace(/^www\./, '')
    return host === self ? 'direct' : host
  } catch {
    return 'direct'
  }
}
