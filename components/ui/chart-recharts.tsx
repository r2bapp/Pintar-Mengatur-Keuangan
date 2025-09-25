"use client"

import * as React from "react"
import type * as TooltipPrimitive from "@radix-ui/react-tooltip"
import {
  type ChartConfig as RechartsChartConfig,
  ChartContainer as RechartsChartContainer,
  ChartTooltip as RechartsChartTooltip,
  ChartTooltipContent as RechartsChartTooltipContent,
} from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = RechartsChartConfig

const ChartContainer = React.forwardRef<
  React.ElementRef<typeof RechartsChartContainer>,
  React.ComponentPropsWithoutRef<typeof RechartsChartContainer>
>(({ className, ...props }, ref) => (
  <RechartsChartContainer ref={ref} className={cn("flex h-[400px] w-full", className)} {...props} />
))
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = React.forwardRef<
  React.ElementRef<typeof RechartsChartTooltip>,
  React.ComponentPropsWithoutRef<typeof RechartsChartTooltip>
>(({ ...props }, ref) => (
  <RechartsChartTooltip
    ref={ref}
    cursor={false}
    contentStyle={{
      padding: 0,
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow)",
      border: "none",
    }}
    {...props}
  />
))
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    nameKey?: string
    valueKey?: string
  }
>(({ className, hideLabel = false, hideIndicator = false, nameKey, valueKey, ...props }, ref) => (
  <RechartsChartTooltipContent
    ref={ref}
    hideLabel={hideLabel}
    hideIndicator={hideIndicator}
    nameKey={nameKey}
    valueKey={valueKey}
    className={cn(
      "grid min-w-[120px] items-center data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
))
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
