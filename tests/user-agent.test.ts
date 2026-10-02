import { describe, expect, it } from 'vitest'
import { parseReferrer, parseUserAgent } from '@/lib/core/user-agent'

const UA = {
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Safari/604.1',
  androidTablet: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  androidPhone:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 SamsungBrowser/24.0 Chrome/117.0 Mobile Safari/537.36',
  edgeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36 Edg/124.0',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  operaChromeOs: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/124.0 Safari/537.36 OPR/109.0',
  windowsPhone: 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1) AppleWebKit/537.36 Mobile Safari/537.36 Edge/40',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  curl: 'curl/8.4.0',
}

describe('parseUserAgent', () => {
  it('handles missing user agents', () => {
    expect(parseUserAgent(null)).toEqual({ device: 'unknown', browser: 'Unknown', os: 'Unknown' })
    expect(parseUserAgent('')).toEqual({ device: 'unknown', browser: 'Unknown', os: 'Unknown' })
  })

  it.each([
    ['chromeMac', 'desktop', 'Chrome', 'macOS'],
    ['safariIphone', 'mobile', 'Safari', 'iOS'],
    ['ipad', 'tablet', 'Safari', 'iOS'],
    ['androidTablet', 'tablet', 'Chrome', 'Android'],
    ['androidPhone', 'mobile', 'Chrome', 'Android'],
    ['samsung', 'mobile', 'Samsung Internet', 'Android'],
    ['edgeWin', 'desktop', 'Edge', 'Windows'],
    ['firefoxLinux', 'desktop', 'Firefox', 'Linux'],
    ['operaChromeOs', 'desktop', 'Opera', 'ChromeOS'],
    ['windowsPhone', 'mobile', 'Safari', 'Windows Phone'],
    ['googlebot', 'bot', 'Bot', 'Other'],
    ['curl', 'bot', 'Bot', 'Other'],
  ] as const)('parses %s', (key, device, browser, os) => {
    expect(parseUserAgent(UA[key])).toEqual({ device, browser, os })
  })

  it('falls back to Other for unknown browsers', () => {
    expect(parseUserAgent('SomeApp/1.0 (Macintosh)').browser).toBe('Other')
  })
})

describe('parseReferrer', () => {
  it('returns direct when absent or invalid', () => {
    expect(parseReferrer(null)).toBe('direct')
    expect(parseReferrer('not a url')).toBe('direct')
  })

  it('extracts the host without www', () => {
    expect(parseReferrer('https://www.twitter.com/post/1')).toBe('twitter.com')
  })

  it('treats self-referrals as direct', () => {
    expect(parseReferrer('https://sho.rt/abc', 'sho.rt:443')).toBe('direct')
  })
})
