
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"


const chartConfig = {
  plates: {
    label: "Plates",
  },
  "600x300mm": {
    label: "600x300mm",
    color: "hsl(var(--chart-1))",
  },
  "1200x600mm": {
    label: "1200x600mm",
    color: "hsl(var(--chart-2))",
  },
  "900x600mm": {
    label: "900x600mm",
    color: "hsl(var(--chart-3))",
  },
  "300x300mm": {
      label: "300x300mm",
      color: "hsl(var(--chart-4))"
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

interface PlatePopularityChartProps {
    data: { name: string; value: number }[];
}

export default function PlatePopularityChart({ data }: PlatePopularityChartProps) {

   const chartData = React.useMemo(() => data.map(item => ({
        ...item,
        fill: chartConfig[item.name as keyof typeof chartConfig]?.color || chartConfig.other.color
    })), [data]);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}
