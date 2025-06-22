
"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  customers: {
    label: "New Customers",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface NewCustomersChartProps {
    data: { name: string; customers: number }[];
}

export default function NewCustomersChart({ data }: NewCustomersChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <LineChart accessibilityLayer data={data}>
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
        <Line dataKey="customers" type="natural" stroke="var(--color-customers)" strokeWidth={2} dot={true} />
      </LineChart>
    </ChartContainer>
  )
}
