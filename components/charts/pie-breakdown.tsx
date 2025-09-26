"use client"

import { PieChart as RechartsPieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

export default function PieBreakdownChart({
  data,
  config,
  formatCurrency,
  className,
}: {
  data: CategoryData[]
  config: ChartConfig
  formatCurrency: (n: number) => string
  className?: string
}) {
  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <RechartsPieChart>
          <ChartTooltip
            content={<ChartTooltipContent nameKey="category" valueKey="amount" formatter={formatCurrency} />}
          />
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={60}
            outerRadius={100}
            label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
