"use client";

import { Label, Pie, PieChart } from "recharts";

import { useChartAnimation } from "@/components/admin/seo/health/charts/chart-panel";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type DonutSlice = { key: string; label: string; value: number; color: string };

/** A donut with the total in the middle; zero-value slices are left out. */
export function DonutChart({
  slices,
  caption,
  className,
}: {
  slices: DonutSlice[];
  caption: string;
  className?: string;
}) {
  const animate = useChartAnimation();
  const config = Object.fromEntries(slices.map((slice) => [slice.key, { label: slice.label, color: slice.color }])) satisfies ChartConfig;
  const data = slices.filter((slice) => slice.value > 0).map((slice) => ({ ...slice, fill: `var(--color-${slice.key})` }));
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <ChartContainer config={config} className={cn("mx-auto aspect-square w-full max-w-60", className)}>
      <PieChart accessibilityLayer>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius="64%" strokeWidth={4} isAnimationActive={animate}>
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
              const cx = viewBox.cx ?? 0;
              const cy = viewBox.cy ?? 0;
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={cx} y={cy - 6} className="fill-foreground text-2xl font-semibold tabular-nums">
                    {total.toLocaleString()}
                  </tspan>
                  <tspan x={cx} y={cy + 14} className="fill-muted-foreground text-[11px]">
                    {caption}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
        <ChartLegend itemSorter={null} content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  );
}

export function ChecksDonut({ passed, failed, className }: { passed: number; failed: number; className?: string }) {
  return (
    <DonutChart
      caption="checks"
      className={className}
      slices={[
        { key: "passed", label: "Passed", value: passed, color: "var(--score-good)" },
        { key: "failed", label: "Failed", value: failed, color: "var(--score-bad)" },
      ]}
    />
  );
}
