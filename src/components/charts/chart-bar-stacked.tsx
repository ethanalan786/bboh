"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A stacked bar chart with a legend"

const chartData = [
  { month: "January", burnbox: 186, boxapparel: 80 },
  { month: "February", burnbox: 305, boxapparel: 200 },
  { month: "March", burnbox: 237, boxapparel: 120 },
  { month: "April", burnbox: 73, boxapparel: 190 },
  { month: "May", burnbox: 209, boxapparel: 130 },
  { month: "June", burnbox: 214, boxapparel: 140 },
]

const chartConfig = {
  burnbox: {
    label: "Burn Box",
    color: "var(--chart-1)",
  },
  boxapparel: {
    label: "Box Apparel",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartBarStacked() {
  return (
    <Card className="bg-[#0a0a0a] border-white/6">
      <CardHeader>
        <CardTitle className="text-white">Sales - Burn Box + Box Apparel</CardTitle>
        <CardDescription className="text-white/40">January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-75">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="burnbox"
              stackId="a"
              fill="var(--color-burnbox)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="boxapparel"
              stackId="a"
              fill="var(--color-boxapparel)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
