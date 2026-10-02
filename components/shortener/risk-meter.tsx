import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import type { RiskLevel, RiskReport } from '@/lib/core/risk'
import { cn } from '@/lib/utils'

const LEVEL_STYLES: Record<RiskLevel, { label: string; text: string; bar: string; Icon: typeof ShieldCheck }> = {
  safe: { label: 'Looks safe', text: 'text-success', bar: 'bg-success', Icon: ShieldCheck },
  suspicious: { label: 'Suspicious', text: 'text-warning', bar: 'bg-warning', Icon: ShieldAlert },
  dangerous: { label: 'Blocked', text: 'text-destructive', bar: 'bg-destructive', Icon: ShieldX },
}

export function RiskMeter({ report, pending }: { report: RiskReport | null; pending?: boolean }) {
  if (!report) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Paste a URL to run the malicious-link check before shortening.
      </div>
    )
  }

  const style = LEVEL_STYLES[report.level]
  return (
    <section
      aria-label="Link risk assessment"
      aria-live="polite"
      className={cn('rounded-lg border border-border bg-secondary/40 px-4 py-3 transition-opacity', pending && 'opacity-60')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={cn('flex items-center gap-2 text-sm font-medium', style.text)}>
          <style.Icon className="size-4" aria-hidden="true" />
          {style.label}
        </div>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          <span className={style.text}>{report.score}</span>/100
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
        aria-label="Risk score"
      >
        <div className={cn('h-full rounded-full transition-all', style.bar)} style={{ width: `${Math.max(report.score, 2)}%` }} />
      </div>
      {report.signals.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {report.signals.map((signal) => (
            <li key={signal.id} className="flex items-start justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{signal.label}</span>
              <span className="shrink-0 font-mono tabular-nums text-foreground">+{signal.points}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No risk signals detected.</p>
      )}
    </section>
  )
}
