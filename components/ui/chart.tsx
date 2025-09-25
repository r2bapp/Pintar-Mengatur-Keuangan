"use client"

import * as React from "react"
import { Label } from "@radix-ui/react-label"
import {
  CartesianGrid,
  Dot,
  Line,
  type LineProps,
  Pie,
  type PieProps,
  PieChart,
  XAxis,
  type XAxisProps,
  YAxis,
  type YAxisProps,
} from "recharts"
import {
  ChartContainer as RechartsChartContainer,
  ChartTooltip as RechartsChartTooltip,
  ChartTooltipContent as RechartsChartTooltipContent,
} from "@/components/ui/chart-recharts" // Assuming this path for shadcn/ui chart components

import { cn } from "@/lib/utils"

// Re-export Chart components from shadcn/ui's chart-recharts for convenience
export {
  RechartsChartContainer as ChartContainer,
  RechartsChartTooltip as ChartTooltip,
  RechartsChartTooltipContent as ChartTooltipContent,
}

// Custom Chart components for specific chart types (Line, Pie)
// You can extend these or add more as needed

interface ChartProps extends React.ComponentProps<typeof RechartsChartContainer> {
  data: any[]
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(({ className, children, ...props }, ref) => (
  <RechartsChartContainer ref={ref} className={cn("h-[400px] w-full", className)} {...props}>
    {children}
  </RechartsChartContainer>
))
Chart.displayName = "Chart"

interface ChartLineProps extends LineProps {
  dataKey: string
  stroke?: string
  name?: string
}

const ChartLine = React.forwardRef<typeof Line, ChartLineProps>(({ dataKey, stroke, name, ...props }, ref) => (
  <Line
    ref={ref}
    dataKey={dataKey}
    stroke={stroke || "var(--color-primary)"}
    name={name || dataKey}
    dot={<Dot r={4} fill="var(--color-primary)" stroke="var(--color-primary)" />}
    activeDot={<Dot r={6} fill="var(--color-primary)" stroke="var(--color-primary)" />}
    {...props}
  />
))
ChartLine.displayName = "ChartLine"

interface ChartPieProps extends PieProps {
  dataKey: string
  nameKey?: string
  fill?: string
  outerRadius?: number
  innerRadius?: number
}

const ChartPie = React.forwardRef<typeof Pie, ChartPieProps>(
  ({ dataKey, nameKey = "category", fill, outerRadius = 80, innerRadius = 0, ...props }, ref) => (
    <Pie
      ref={ref}
      dataKey={dataKey}
      nameKey={nameKey}
      fill={fill || "var(--color-primary)"}
      outerRadius={outerRadius}
      innerRadius={innerRadius}
      labelLine={false}
      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
      {...props}
    />
  ),
)
ChartPie.displayName = "ChartPie"

interface ChartXAxisProps extends XAxisProps {
  dataKey: string
}

const ChartXAxis = React.forwardRef<typeof XAxis, ChartXAxisProps>(({ dataKey, ...props }, ref) => (
  <XAxis ref={ref} dataKey={dataKey} stroke="hsl(var(--border))" tickLine={false} axisLine={false} {...props} />
))
ChartXAxis.displayName = "ChartXAxis"

interface ChartYAxisProps extends YAxisProps {
  dataKey?: string
}

const ChartYAxis = React.forwardRef<typeof YAxis, ChartYAxisProps>(({ dataKey, ...props }, ref) => (
  <YAxis ref={ref} dataKey={dataKey} stroke="hsl(var(--border))" tickLine={false} axisLine={false} {...props} />
))
ChartYAxis.displayName = "ChartYAxis"

interface ChartLegendProps extends React.ComponentProps<typeof Label> {}

const ChartLegend = React.forwardRef<HTMLLabelElement, ChartLegendProps>(({ className, ...props }, ref) => (
  <Label ref={ref} className={cn("text-sm font-medium text-muted-foreground", className)} {...props} />
))
ChartLegend.displayName = "ChartLegend"

export { Chart, ChartLine, ChartPie, ChartXAxis, ChartYAxis, ChartLegend, CartesianGrid, Dot, PieChart }
