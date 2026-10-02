import { RecentLinks } from '@/components/shortener/recent-links'
import { ShortenForm } from '@/components/shortener/shorten-form'
import { SiteHeader } from '@/components/site-header'

const FEATURES = [
  { title: 'Collision-free codes', body: 'Base62 of a Postgres sequence, bijectively scrambled. Retries if an alias got there first.' },
  { title: 'Risk-scored', body: '18 URL heuristics. Score ≥ 70 is refused before a code is ever issued.' },
  { title: 'Private analytics', body: 'Device, browser, OS, referrer and time. No IPs, no geolocation.' },
]

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:py-14">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Short links that are checked before they ship.
          </h1>
          <p className="max-w-xl text-pretty text-muted-foreground">
            Paste a URL, pick an optional alias and expiry, and get a QR-ready short link. Suspicious destinations are
            scored live and dangerous ones are blocked.
          </p>
        </div>

        <ShortenForm />

        <ul className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex flex-col gap-1">
              <h2 className="text-sm font-medium">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </li>
          ))}
        </ul>

        <RecentLinks />
      </main>
    </>
  )
}
