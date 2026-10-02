import { expect, test } from 'vitest'
import { codeFromId } from '@/lib/core/base62'
import { scoreUrl } from '@/lib/core/risk'
import { parseUserAgent } from '@/lib/core/user-agent'

function measure(name: string, fn: (i: number) => void, durationMs = 500) {
  for (let i = 0; i < 1_000; i++) fn(i)
  let ops = 0
  const start = performance.now()
  while (performance.now() - start < durationMs) {
    for (let i = 0; i < 200; i++) fn(ops + i)
    ops += 200
  }
  const opsPerSec = Math.round(ops / ((performance.now() - start) / 1000))
  console.log(`${name.padEnd(36)} ${opsPerSec.toLocaleString('en-US').padStart(14)} ops/sec`)
  return opsPerSec
}

test('core hot paths throughput', () => {
  const results = [
    measure('codeFromId', (i) => codeFromId(i + 1)),
    measure('scoreUrl (phishing-style URL)', () =>
      scoreUrl('http://paypal-secure-login.verify-account.xyz/signin?redirect=https://x.y'),
    ),
    measure('parseUserAgent (iPhone Safari)', () =>
      parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1'),
    ),
  ]
  for (const ops of results) expect(ops).toBeGreaterThan(0)
}, 10_000)
