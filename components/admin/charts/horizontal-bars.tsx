"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";

import { useChartAnimation } from "@/components/admin/charts/chart-panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "cn";

export type BarRow = { key: string; label: string; value: number; fill?: string; hint?: string };

const ROW_HEIGHT = 34;
const LABEL_MAX = 24;

function shorten(text: string) {
  return text.length > LABEL_MAX ? `${text.slice(0, LABEL_MAX - 1)}…` : text;
}

export type HorizontalBarsProps = {
  rows: BarRow[];
  valueLabel: string;
  format?: (value: number) => string;
  /** Fixed axis end, e.g. 100 for scores; defaults to the data. */
  max?: number;
  reference?: { value: number; label: string };
  /** Colour for rows without their own `fill`. */
  defaultFill?: (value: number) => string;
  className?: string;
};

const chartFill = () => "var(--chart-1)";

/** Horizontal bars with the label on the left and the value on the right. */
export function HorizontalBars({
  rows,
  valueLabel,
  format = (value) => `${value}%`,
  max,
  reference,
  defaultFill = chartFill,
  className,
}: HorizontalBarsProps) {
  const animate = useChartAnimation();
  const config = { value: { label: valueLabel } } satisfies ChartConfig;
  const data = rows.map((row) => ({ ...row, fill: row.fill ?? defaultFill(row.value) }));
  const top = Math.max(max ?? 0, reference?.value ?? 0, ...data.map((row) => row.value));

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto w-full", className)}
      style={{ height: Math.max(1, data.length) * ROW_HEIGHT + (reference ? 40 : 24) }}
    >
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 4, right: 72, top: reference ? 16 : 0 }}>
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={150}
          tickFormatter={shorten}
        />
        <XAxis type="number" dataKey="value" domain={[0, top || 1]} hide />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as BarRow | undefined;
                return row ? (row.hint ? `${row.label} · ${row.hint}` : row.label) : null;
              }}
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums text-foreground">{format(Number(value))}</span>
              )}
            />
          }
        />
        {reference ? (
          <ReferenceLine
            x={reference.value}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{ value: reference.label, position: "top", className: "fill-muted-foreground text-[10px]" }}
          />
        ) : null}
        <Bar dataKey="value" radius={4} maxBarSize={22} isAnimationActive={animate}>
          <LabelList
            dataKey="value"
            content={({ x, y, width, height, value }) => (
              <text
                x={Number(x) + Number(width) + 8}
                y={Number(y) + Number(height) / 2}
                dominantBaseline="middle"
                className="fill-foreground text-xs tabular-nums"
              >
                {format(Number(value))}
              </text>
            )}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
