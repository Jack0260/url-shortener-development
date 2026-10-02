'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const config = { clicks: { label: 'Clicks', color: 'var(--chart-1)' } } satisfies ChartConfig

export function TimelineChart({
  data,
  granularity,
}: {
  data: { bucket: string; clicks: number }[]
  granularity: 'hour' | 'day'
}) {
  const format = (iso: string) =>
    granularity === 'hour'
      ? new Date(iso).toLocaleTimeString([], { hour: 'numeric' })
      : new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-clicks)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-clicks)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={format} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(String(value))} />} />
        <Area dataKey="clicks" type="monotone" stroke="var(--color-clicks)" strokeWidth={2} fill="url(#clicksFill)" />
      </AreaChart>
    </ChartContainer>
  )
}
