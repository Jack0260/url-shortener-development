#!/usr/bin/env node
// Usage: node scripts/benchmark.mjs --base http://localhost:3000 --duration 10 --concurrency 50 --target redirect
// Targets: redirect (GET /:code, the hot path) | check (GET /api/check, shows rate limiting kick in)

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]])
    return pairs
  }, []),
)

const base = (args.base ?? 'http://localhost:3000').replace(/\/$/, '')
const durationMs = Number(args.duration ?? 10) * 1000
const concurrency = Number(args.concurrency ?? 50)
const target = args.target ?? 'redirect'

async function setup() {
  if (target === 'check') return `${base}/api/check?url=${encodeURIComponent('https://example.com/docs')}`
  const res = await fetch(`${base}/api/links`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: `https://example.com/benchmark/${Date.now()}` }),
  })
  if (!res.ok) throw new Error(`Could not create benchmark link: ${res.status} ${await res.text()}`)
  const { code } = await res.json()
  return `${base}/${code}`
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

async function main() {
  const url = await setup()
  console.log(`Benchmarking ${url}\n  duration=${durationMs / 1000}s concurrency=${concurrency}\n`)

  const latencies = []
  const statuses = new Map()
  let errors = 0
  const deadline = performance.now() + durationMs
  const startedAt = performance.now()

  async function worker() {
    while (performance.now() < deadline) {
      const t0 = performance.now()
      try {
        const res = await fetch(url, { redirect: 'manual' })
        await res.arrayBuffer()
        statuses.set(res.status, (statuses.get(res.status) ?? 0) + 1)
        latencies.push(performance.now() - t0)
      } catch {
        errors += 1
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  const elapsed = (performance.now() - startedAt) / 1000
  latencies.sort((a, b) => a - b)

  const fmt = (ms) => `${ms.toFixed(1)}ms`
  console.log(`Requests:     ${latencies.length} (${errors} network errors)`)
  console.log(`Throughput:   ${(latencies.length / elapsed).toFixed(1)} req/sec`)
  console.log(
    `Latency:      p50 ${fmt(percentile(latencies, 50))}  p95 ${fmt(percentile(latencies, 95))}  p99 ${fmt(percentile(latencies, 99))}  max ${fmt(latencies.at(-1) ?? 0)}`,
  )
  console.log(`Status codes: ${[...statuses].map(([s, n]) => `${s}=${n}`).join('  ')}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
