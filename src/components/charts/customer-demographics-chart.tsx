
"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"

const chartConfig = {
  customers: {
    label: "Customers",
  },
  "New (First rental in last 6 mo)": {
    label: "New",
    color: "hsl(var(--chart-1))",
  },
  "Returning": {
    label: "Returning",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface CustomerDemographicsChartProps {
  data: { name: string; value: number; fill: string }[];
}

export default function CustomerDemographicsChart({ data }: CustomerDemographicsChartProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          strokeWidth={5}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="[&_.recharts-legend-item]:w-full [&_.recharts-legend-item-text]:truncate"
        />
      </PieChart>
    </ChartContainer>
  )
}
