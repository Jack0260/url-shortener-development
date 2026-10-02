'use client'

import { Link2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch, ApiError, fetcher } from '@/lib/fetcher'
import type { CreatedLinkResponse, RiskCheckResponse } from '@/lib/types'
import { ResultCard } from './result-card'
import { RiskMeter } from './risk-meter'

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
]

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function ShortenForm() {
  const { mutate } = useSWRConfig()
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [expiresIn, setExpiresIn] = useState('never')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreatedLinkResponse | null>(null)

  const debouncedUrl = useDebounced(url.trim(), 350)
  const { data: risk, error: riskError, isValidating } = useSWR<RiskCheckResponse>(
    debouncedUrl.length > 3 ? `/api/check?url=${encodeURIComponent(debouncedUrl)}` : null,
    fetcher,
    { keepPreviousData: true, shouldRetryOnError: false, revalidateOnFocus: false },
  )

  const showRisk = debouncedUrl.length > 3 && !riskError ? (risk ?? null) : null
  const blocked = Boolean(showRisk?.blocked && url.trim() === debouncedUrl)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const created = await apiFetch<CreatedLinkResponse>('/api/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, alias: alias || undefined, expiresIn }),
      })
      setResult(created)
      setUrl('')
      setAlias('')
      mutate('/api/links')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'rate_limited') {
        setError('Rate limit reached: 10 links per minute. Try again shortly.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="url">Destination URL</Label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com/a/very/long/path"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-11 pl-9 font-mono text-sm"
              required
              aria-describedby="risk-help"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="alias">
              Custom alias <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex h-9 items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="pl-3 font-mono text-sm text-muted-foreground" aria-hidden="true">
                /
              </span>
              <input
                id="alias"
                name="alias"
                placeholder="launch-2026"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                pattern="[A-Za-z0-9_\-]{3,32}"
                maxLength={32}
                className="h-full min-w-0 flex-1 bg-transparent pr-3 pl-0.5 font-mono text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="expiry">Expires</Label>
            <Select items={EXPIRY_OPTIONS} value={expiresIn} onValueChange={(v) => setExpiresIn((v as string) ?? 'never')}>
              <SelectTrigger id="expiry" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div id="risk-help">
          <RiskMeter report={showRisk} pending={isValidating} />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="h-11" disabled={submitting || !url.trim() || blocked}>
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {blocked ? 'Blocked by safety check' : submitting ? 'Shortening…' : 'Shorten link'}
        </Button>
      </form>

      {result && <ResultCard link={result} />}
    </div>
  )
}
