"use client"

import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts"
import type { BarShapeProps } from "recharts/types/cartesian/Bar"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A bar chart with an active bar"

interface WeeklyData {
  day: string
  label: string
  value: number
  fill: string
}

interface ChartBarActiveProps {
  data?: WeeklyData[]
  activeIndex?: number
}

const defaultChartData: WeeklyData[] = [
  { day: "monday", label: "Monday", value: 187, fill: "var(--chart-1)" },
  { day: "tuesday", label: "Tuesday", value: 200, fill: "var(--chart-2)" },
  { day: "wednesday", label: "Wednesday", value: 275, fill: "var(--chart-3)" },
  { day: "thursday", label: "Thursday", value: 173, fill: "var(--chart-4)" },
  { day: "friday", label: "Friday", value: 90, fill: "var(--chart-5)" },
]

const chartConfig = {
  value: {
    label: "Earning",
  },
  monday: {
    label: "MON",
    color: "var(--chart-1)",
  },
  tuesday: {
    label: "TUE",
    color: "var(--chart-2)",
  },
  wednesday: {
    label: "WED",
    color: "var(--chart-3)",
  },
  thursday: {
    label: "THU",
    color: "var(--chart-4)",
  },
  friday: {
    label: "FRI",
    color: "var(--chart-5)",
  },
  saturday: {
    label: "SAT",
    color: "var(--chart-5)",
  },
  sunday: {
    label: "SUN",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartBarActive({ data = defaultChartData, activeIndex = 2 }: ChartBarActiveProps) {
  const chartData = data.map((item, index) => ({
    day: item.day,
    value: item.value,
    fill: item.fill
  }))

  return (
    <div className="h-full w-full">
        <ChartContainer config={chartConfig} className="h-42 sm:h-75">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label || value
              }
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="value"
              strokeWidth={2}
              radius={8}
              fill="var(--color-value)"
              shape={({ index, ...props }: BarShapeProps) =>
                index === activeIndex ? (
                  <Rectangle
                    {...props}
                    fillOpacity={0.8}
                    stroke="var(--color-value)"
                    strokeDasharray={4}
                    strokeDashoffset={4}
                  />
                ) : (
                  <Rectangle {...props} />
                )
              }
            />
          </BarChart>
        </ChartContainer>
    </div>
  )
}
