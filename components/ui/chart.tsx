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
  Legend, // Import Legend from recharts
  Cell, // Import Cell from recharts
  ResponsiveContainer, // Import ResponsiveContainer
  LineChart, // Import LineChart from recharts
} from "recharts"

import { cn } from "@/lib/utils"
import {
  TooltipContent as ShadcnTooltipContent, // Use shadcn's TooltipContent for the actual tooltip UI
  Tooltip as ShadcnTooltip, // Use shadcn's Tooltip for the wrapper
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip" // Assuming shadcn/ui tooltip is available

// --- ChartConfig Type Definition (from shadcn/ui) ---
export type ChartConfig = {
  [k: string]: {
    label?: string
    icon?: React.ComponentType<{ className?: string }>
    color?: string
  }
}

// --- ChartContainer (from shadcn/ui) ---
interface ChartContainerProps extends React.ComponentProps<typeof ResponsiveContainer> {
  config: ChartConfig
  children?: React.ReactNode
  className?: string
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, ...props }, ref) => {
    const id = React.useId()
    if (!config) {
      return null
    }
    return (
      <div
        data-chart={id}
        ref={ref}
        className={cn(
          "flex h-[400px] w-full items-center justify-center text-xs [&_.recharts-cartesian-grid]:stroke-border [&_.recharts-dot]:fill-primary [&_.recharts-active-dot]:stroke-background [&_.recharts-tooltip-cursor]:fill-accent [&_.recharts-yAxis .recharts-cartesian-axis-tick-value]:fill-foreground [&_.recharts-xAxis .recharts-cartesian-axis-tick-value]:fill-foreground [&_.recharts-xAxis .recharts-axis-line]:stroke-border [&_.recharts-yAxis .recharts-axis-line]:stroke-border",
          className,
        )}
      >
        <ResponsiveContainer {...props}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                ...child.props,
                // Apply colors from config
                children: React.Children.map(child.props.children, (grandchild) => {
                  if (React.isValidElement(grandchild) && "dataKey" in grandchild.props) {
                    const dataKey = grandchild.props.dataKey as string
                    const itemConfig = config[dataKey]
                    if (itemConfig && itemConfig.color) {
                      return React.cloneElement(grandchild, {
                        ...grandchild.props,
                        stroke: itemConfig.color,
                        fill: itemConfig.color,
                      })
                    }
                  }
                  return grandchild
                }),
              })
            }
            return child
          })}
        </ResponsiveContainer>
      </div>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

// --- ChartTooltip (from shadcn/ui) ---
interface ChartTooltipProps extends React.ComponentProps<typeof ShadcnTooltip> {
  content?: React.ReactNode
}

const ChartTooltip = React.forwardRef<React.ElementRef<typeof ShadcnTooltip>, ChartTooltipProps>(
  ({ children, content, ...props }, ref) => (
    <TooltipProvider>
      <ShadcnTooltip ref={ref} {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <ShadcnTooltipContent>{content}</ShadcnTooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  ),
)
ChartTooltip.displayName = "ChartTooltip"

// --- ChartTooltipContent (from shadcn/ui) ---
interface ChartTooltipContentProps extends React.ComponentProps<typeof ShadcnTooltipContent> {
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  valueKey?: string
  formatter?: (value: any, name: string, props: any) => React.ReactNode
}

const ChartTooltipContent = React.forwardRef<React.ElementRef<typeof ShadcnTooltipContent>, ChartTooltipContentProps>(
  ({ indicator = "dot", nameKey, valueKey, formatter, className, ...props }, ref) => {
    return (
      <ShadcnTooltipContent ref={ref} className={cn("grid min-w-[120px] items-center", className)} {...props}>
        {(payload) => {
          if (!payload || payload.length === 0) return null
          const { payload: itemPayload, label } = payload[0]
          return (
            <div className="grid gap-1">
              <div className="text-sm font-medium leading-none">{label}</div>
              {payload.map((item, index) => {
                const name = nameKey ? itemPayload[nameKey] : item.name
                const value = valueKey ? itemPayload[valueKey] : item.value
                const formattedValue = formatter ? formatter(value, name, item) : value
                return (
                  <div key={item.dataKey || index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {indicator === "dot" && (
                        <span className="flex h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      )}
                      {indicator === "line" && (
                        <span className="flex h-3 w-1 rounded-full" style={{ backgroundColor: item.color }} />
                      )}
                      {indicator === "dashed" && (
                        <span
                          className="flex h-3 w-3 rounded-full border-2 border-dashed"
                          style={{ borderColor: item.color }}
                        />
                      )}
                      <span className="text-muted-foreground">{name}</span>
                    </div>
                    <span className="font-medium">{formattedValue}</span>
                  </div>
                )
              })}
            </div>
          )
        }}
      </ShadcnTooltipContent>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

// --- My custom Chart components (using the shadcn ChartContainer) ---
interface ChartComponentProps extends React.ComponentProps<typeof ChartContainer> {
  data: any[]
}

const Chart = React.forwardRef<HTMLDivElement, ChartComponentProps>(({ className, children, ...props }, ref) => (
  <ChartContainer ref={ref} className={cn("h-[400px] w-full", className)} {...props}>
    {children}
  </ChartContainer>
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

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLine,
  ChartPie,
  ChartXAxis,
  ChartYAxis,
  ChartLegend,
  CartesianGrid,
  Dot,
  PieChart, // Re-export Recharts PieChart
  LineChart, // Re-export Recharts LineChart
  Legend as RechartsLegend, // Re-export Recharts Legend to avoid conflict with ChartLegend
  Cell, // Re-export Recharts Cell
}
