"use client"

import type * as React from "react"
import { Tooltip as RechartsTooltip } from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: string
    color: string // CSS color value, e.g. "hsl(var(--chart-1))" or "#007a33"
  }
>

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
}

/**
 * ChartContainer
 * - Applies CSS variables for each dataKey in the config like: --color-income, --color-expense, etc.
 * - Wrap your Recharts inside this container. It helps keep styles consistent and themeable.
 */
export function ChartContainer({ config, className, style, ...props }: ChartContainerProps) {
  const cssVars: React.CSSProperties = { ...style }

  Object.entries(config).forEach(([key, value]) => {
    cssVars[`--color-${key}` as any] = value.color
  })

  return <div className={cn("w-full h-full [&_svg]:overflow-visible", className)} style={cssVars} {...props} />
}

/**
 * ChartTooltip
 * - Re-export of Recharts Tooltip under our naming convention.
 * - Use with <ChartTooltip content={<ChartTooltipContent />} />
 */
export function ChartTooltip(props: React.ComponentProps<typeof RechartsTooltip<any, any>>) {
  return <RechartsTooltip {...props} />
}

/**
 * ChartTooltipContent
 * - Minimal tooltip content component for Recharts.
 * - You can pass indicator="dashed" to match shadcn/ui styling, and nameKey/valueKey/formatter to control display.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  indicator,
  nameKey,
  valueKey,
  formatter,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  indicator?: "solid" | "dashed"
  nameKey?: string
  valueKey?: string
  formatter?: (value: number) => string
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  // If nameKey/valueKey provided (like Pie), build a single-entry tooltip.
  if (nameKey && valueKey) {
    const item = payload[0]?.payload
    const name = item?.[nameKey]
    const valueRaw = item?.[valueKey]
    const value = typeof valueRaw === "number" && formatter ? formatter(valueRaw) : valueRaw
    return (
      <div className="rounded-md border bg-white px-3 py-2 text-sm shadow-sm">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground">{String(value)}</div>
      </div>
    )
  }

  // Default (like Line/Bar chart with multiple series)
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-sm shadow-sm">
      {label && <div className="mb-1 font-medium">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const color = entry.color ?? entry.stroke
          const name = entry.name
          const valueRaw = entry.value
          const value = typeof valueRaw === "number" && formatter ? formatter(valueRaw) : valueRaw
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full border",
                  indicator === "dashed" ? "border-dashed" : "border-solid",
                )}
                style={{ backgroundColor: color, borderColor: color }}
              />
              <span className="text-muted-foreground">{name}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ChartContainer as default }
