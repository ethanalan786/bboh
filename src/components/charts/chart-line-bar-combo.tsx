"use client"

import { Line, Bar, XAxis, CartesianGrid, ComposedChart, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A combined line and bar chart"

interface ChartLineBarComboProps {
  data: Array<{ time: string; value: number; barValue: number }>
  config?: ChartConfig
}

export function ChartLineBarCombo({ data, config }: ChartLineBarComboProps) {
  const defaultConfig = {
    value: {
      label: "Sales",
    },
  } satisfies ChartConfig

  const chartConfig = config || defaultConfig

  return (
    <ChartContainer config={chartConfig} className="h-75">
      <ComposedChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="time"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value}
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar 
          dataKey="barValue" 
          fill="rgba(16, 185, 129, 0.3)" 
          radius={2}
        />
        <Line
          dataKey="value"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: "#10b981", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ChartContainer>
  )
}