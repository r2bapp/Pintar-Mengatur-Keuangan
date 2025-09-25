"use client"

import * as React from "react"
import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import {
  ChartContainer,
  ChartLine,
  ChartTooltipContent,
} from "@/components/ui/chart"


const data = [
  { month: "Jan", income: 4000, expense: 2400 },
  { month: "Feb", income: 3000, expense: 1398 },
  { month: "Mar", income: 2000, expense: 9800 },
  { month: "Apr", income: 2780, expense: 3908 },
  { month: "May", income: 1890, expense: 4800 },
  { month: "Jun", income: 2390, expense: 3800 },
  { month: "Jul", income: 3490, expense: 4300 },
]

const chartConfig = {
  income: {
    label: "Pendapatan",
    color: "#22c55e", // hijau
  },
  expense: {
    label: "Pengeluaran",
    color: "#ef4444", // merah
  },
}

export default function FinanceLineChart() {
  return (
    <ChartContainer config={chartConfig}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <RechartsLegend />
        <ChartLine dataKey="income" />
        <ChartLine dataKey="expense" />
      </LineChart>
    </ChartContainer>
  )
}
