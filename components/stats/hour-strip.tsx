export function HourStrip({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours)
  return (
    <section aria-label="Clicks by hour of day (UTC)" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium">
        Hour of day <span className="font-normal text-muted-foreground">(UTC)</span>
      </h3>
      <ol className="grid grid-cols-12 gap-1 sm:grid-cols-24">
        {hours.map((count, hour) => (
          <li
            key={hour}
            className="aspect-square rounded-sm bg-primary"
            style={{ opacity: count === 0 ? 0.08 : 0.2 + (count / max) * 0.8 }}
            title={`${String(hour).padStart(2, '0')}:00 — ${count} clicks`}
          >
            <span className="sr-only">{`${hour}:00, ${count} clicks`}</span>
          </li>
        ))}
      </ol>
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground" aria-hidden="true">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </section>
  )
}
