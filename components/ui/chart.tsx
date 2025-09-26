"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Dot, Line, type LineProps } from "recharts"

export type ChartConfig = {
  [k: string]: {
    label?: string
    icon?: React.ComponentType<{ className?: string }>
    color?: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children?: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, style, ...props }, ref) => {
    const id = React.useId()

    // Map config colors to CSS variables like --color-income, --color-expense, etc.
    const cssVars: React.CSSProperties = { ...(style || {}) }
    Object.entries(config || {}).forEach(([key, value]) => {
      const varName = `--color-${key}`
      ;(cssVars as any)[varName] = value?.color ?? "hsl(var(--chart-1))"
    })

    return (
      <div
        data-chart={id}
        ref={ref}
        style={cssVars}
        className={cn(
          "flex w-full items-center justify-center text-xs",
          "min-h-[280px] md:min-h-[320px] lg:min-h-[360px]",
          // nice default theming for axis/grid/ticks
          "[&_.recharts-cartesian-grid]:stroke-border",
          "[&_.recharts-yAxis_.recharts-cartesian-axis-tick-value]:fill-foreground",
          "[&_.recharts-xAxis_.recharts-cartesian-axis-tick-value]:fill-foreground",
          "[&_.recharts-xAxis_.recharts-axis-line]:stroke-border",
          "[&_.recharts-yAxis_.recharts-axis-line]:stroke-border",
          "[&_.recharts-tooltip-cursor]:fill-muted",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

interface ChartLineProps extends LineProps {
  dataKey: string
  stroke?: string
  name?: string
}

const ChartLine = React.forwardRef<any, ChartLineProps>(({ dataKey, stroke, name, ...props }, ref) => (
  <Line
    ref={ref}
    dataKey={dataKey}
    stroke={stroke || `var(--color-${String(dataKey)})`}
    name={name || dataKey}
    type="monotone"
    strokeWidth={2}
    dot={
      <Dot
        r={4}
        fill={stroke || `var(--color-${String(dataKey)})`}
        stroke={stroke || `var(--color-${String(dataKey)})`}
      />
    }
    activeDot={
      <Dot
        r={6}
        fill={stroke || `var(--color-${String(dataKey)})`}
        stroke={stroke || `var(--color-${String(dataKey)})`}
      />
    }
    {...props}
  />
))
ChartLine.displayName = "ChartLine"

export { ChartContainer, ChartLine }
