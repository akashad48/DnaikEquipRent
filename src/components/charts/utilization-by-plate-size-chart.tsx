
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  utilization: {
    label: "Utilization (%)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface UtilizationByEquipmentChartProps {
    data: { name: string; utilization: number }[];
}

export default function UtilizationByPlateSizeChart({ data }: UtilizationByEquipmentChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <BarChart 
        accessibilityLayer 
        data={data}
        layout="vertical"
        margin={{ left: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="truncate"
          width={120}
        />
        <XAxis dataKey="utilization" type="number" />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            formatter={(value) => `${value}%`}
            />} 
        />
        <Bar dataKey="utilization" fill="var(--color-utilization)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
