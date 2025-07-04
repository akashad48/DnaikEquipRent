
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  rentals: {
    label: "Rentals",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface MonthlyRentalsChartProps {
    data: { name: string; rentals: number }[];
}

export default function MonthlyRentalsChart({ data }: MonthlyRentalsChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator />}
        />
        <Bar dataKey="rentals" fill="var(--color-rentals)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
