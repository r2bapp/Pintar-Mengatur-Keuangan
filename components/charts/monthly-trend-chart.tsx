"use client"

import { CartesianGrid, LineChart, XAxis, YAxis, Legend, Line, Dot, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export interface MonthlyData {
  month: string
  income: number
  expense: number
  savings: number
  balance: number
}

export default function MonthlyTrendChart({
  data,
  config,
  formatCurrency,
  className,
}: {
  data: MonthlyData[]
  config: ChartConfig
  formatCurrency: (n: number) => string
  className?: string
}) {
  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatCurrency} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dashed" formatter={formatCurrency} />}
          />
          <Legend />
          <Line
            dataKey="income"
            type="monotone"
            stroke="var(--color-income)"
            strokeWidth={2}
            dot={<Dot r={3.5} fill="var(--color-income)" stroke="var(--color-income)" />}
            activeDot={<Dot r={5} fill="var(--color-income)" stroke="var(--color-income)" />}
          />
          <Line
            dataKey="expense"
            type="monotone"
            stroke="var(--color-expense)"
            strokeWidth={2}
            dot={<Dot r={3.5} fill="var(--color-expense)" stroke="var(--color-expense)" />}
            activeDot={<Dot r={5} fill="var(--color-expense)" stroke="var(--color-expense)" />}
          />
          <Line
            dataKey="balance"
            type="monotone"
            stroke="var(--color-balance)"
            strokeWidth={2}
            dot={<Dot r={3.5} fill="var(--color-balance)" stroke="var(--color-balance)" />}
            activeDot={<Dot r={5} fill="var(--color-balance)" stroke="var(--color-balance)" />}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
