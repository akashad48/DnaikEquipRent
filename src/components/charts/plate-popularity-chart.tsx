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

// Define an array of colors to cycle through.
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface EquipmentPopularityChartProps {
    data: { name: string; value: number }[];
}

export default function PlatePopularityChart({ data }: EquipmentPopularityChartProps) {

    // Generate dynamic config for labels and colors, which will be used by the legend and tooltip.
    const dynamicChartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            quantity: {
                label: "Quantity" // A default label for the value
            }
        };
        data.forEach((item, index) => {
            config[item.name] = {
                label: item.name,
                color: COLORS[index % COLORS.length]
            }
        });
        return config;
    }, [data]);

    // Add the fill color to the data for the Pie component
    const chartData = React.useMemo(() => data.map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length]
    })), [data]);

    return (
    <ChartContainer
      config={dynamicChartConfig} // Use the dynamic config
      className="mx-auto aspect-square max-h-[220px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="name" />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
             {/* The Cell component is used to specify the color of each slice */}
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}
