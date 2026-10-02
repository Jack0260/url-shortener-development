import { describe, expect, it } from 'vitest'
import { levelForScore, registrableDomain, scoreUrl } from '@/lib/core/risk'

const ids = (url: string) => scoreUrl(url).signals.map((s) => s.id)

describe('registrableDomain', () => {
  it('handles simple and multi-part suffixes', () => {
    expect(registrableDomain('example.com')).toBe('example.com')
    expect(registrableDomain('a.b.example.com')).toBe('example.com')
    expect(registrableDomain('shop.example.co.uk')).toBe('example.co.uk')
  })
})

describe('levelForScore', () => {
  it('maps score bands to levels', () => {
    expect(levelForScore(0)).toBe('safe')
    expect(levelForScore(30)).toBe('suspicious')
    expect(levelForScore(70)).toBe('dangerous')
  })
})

describe('scoreUrl', () => {
  it('scores well-known legitimate URLs as safe', () => {
    for (const url of [
      'https://github.com/vercel/next.js',
      'https://www.paypal.com/myaccount',
      'https://accounts.google.com/',
      'https://www.bbc.co.uk/news',
      'https://pineapple.com/recipes',
    ]) {
      expect(scoreUrl(url).level, url).toBe('safe')
    }
  })

  it('flags each heuristic', () => {
    expect(ids('http://example.com')).toContain('no-https')
    expect(ids('https://192.168.10.4/')).toContain('ip-host')
    expect(ids('https://[2001:db8::1]/')).toContain('ip-host')
    expect(ids('https://user:pw@example.com')).toContain('userinfo')
    expect(ids('https://xn--pple-43d.com')).toContain('punycode')
    expect(ids('https://example.zip')).toContain('tld')
    expect(ids('https://a.b.c.d.example.com')).toContain('subdomains')
    expect(ids('https://my-very-odd-site.com')).toContain('hyphens')
    expect(ids('https://thisisaverylongdomainnamethatgoeson.com')).toContain('long-host')
    expect(ids(`https://example.com/${'a'.repeat(130)}`)).toContain('long-url')
    expect(ids('https://example.com:8443/')).toContain('port')
    expect(ids('https://bit.ly/abc')).toContain('nested-shortener')
    expect(ids('https://paypal.secure-help.com')).toContain('brand')
    expect(ids('https://example.com/login')).toContain('keywords')
    expect(ids('https://example.com/setup.exe')).toContain('executable')
    expect(ids('https://example.com/%61%62%63%64%65')).toContain('encoding')
    expect(ids('https://example.com/?redirect=https://evil.com')).toContain('open-redirect')
    expect(ids('https://site12345.com')).toContain('digits')
  })

  it('caps keyword points at 20', () => {
    const report = scoreUrl('https://example.com/login/verify/account/secure/update/password')
    expect(report.signals.find((s) => s.id === 'keywords')?.points).toBe(20)
  })

  it('classifies an obvious phishing URL as dangerous', () => {
    const report = scoreUrl('http://paypal-secure-login.verify-account.xyz/signin?redirect=https://x.y')
    expect(report.level).toBe('dangerous')
    expect(report.score).toBeGreaterThanOrEqual(70)
  })

  it('never exceeds 100', () => {
    const report = scoreUrl(
      'http://user:pw@paypal-apple-login-secure-verify.a.b.c.xyz:8080/account/update/password/wallet/setup.exe?url=https://e.com&%61%62%63%64%65',
    )
    expect(report.score).toBe(100)
  })
})
