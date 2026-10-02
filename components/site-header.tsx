import { Scissors } from 'lucide-react'
import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Scissors className="size-4" aria-hidden="true" />
          </span>
          snip
        </Link>
        <nav aria-label="API" className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
          <span className="hidden sm:inline">POST /api/links</span>
          <span className="hidden sm:inline">GET /api/check</span>
        </nav>
      </div>
    </header>
  )
}
