"use client";

import { useId, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
} from "recharts";

import { ChartEmpty, useChartAnimation } from "@/components/admin/charts/chart-panel";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "cn";

type Point = { date: string } & Record<string, number | string>;

/**
 * Dates arrive as local `YYYY-MM-DD` already bucketed in the viewer's
 * timezone, so they are formatted as UTC to avoid shifting the day.
 */
function dayLabel(date: string, options: Intl.DateTimeFormatOptions) {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString(undefined, { ...options, timeZone: "UTC" });
}

/**
 * Daily series as stacked bars, stacked areas or plain lines. Series and
 * colours come from `config`; every key in it must exist on each point.
 */
export function TrendChart({
  data,
  config,
  variant = "bar",
  onSelectDay,
  empty = "Nothing recorded in this range.",
  legend = true,
  className,
}: {
  data: Point[];
  config: ChartConfig;
  variant?: "bar" | "area" | "line";
  /** Clicking a day calls this with its `YYYY-MM-DD` date. */
  onSelectDay?: (date: string) => void;
  empty?: ReactNode;
  legend?: boolean;
  className?: string;
}) {
  const animate = useChartAnimation();
  const gradientId = useId().replace(/:/g, "");
  const keys = Object.keys(config);
  const total = data.reduce((sum, point) => sum + keys.reduce((inner, key) => inner + Number(point[key] ?? 0), 0), 0);

  if (total === 0) return <ChartEmpty>{empty}</ChartEmpty>;

  const handleClick = onSelectDay
    ? (state: MouseHandlerDataParam) => {
        if (typeof state.activeLabel === "string") onSelectDay(state.activeLabel);
      }
    : undefined;

  const shared = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
        tickFormatter={(date: string) => dayLabel(date, { month: "short", day: "numeric" })}
      />
      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
      <ChartTooltip
        cursor={variant === "bar" ? { fill: "var(--muted)", opacity: 0.5 } : false}
        content={
          <ChartTooltipContent
            indicator={variant === "bar" ? "dot" : "line"}
            labelFormatter={(date) => dayLabel(String(date), { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          />
        }
      />
      {legend && keys.length > 1 ? <ChartLegend content={<ChartLegendContent />} /> : null}
    </>
  );

  const chartProps = {
    accessibilityLayer: true,
    data,
    margin: { left: 0, right: 8, top: 8 },
    onClick: handleClick,
    className: onSelectDay ? "cursor-pointer" : undefined,
  };

  return (
    <ChartContainer config={config} className={cn("aspect-auto h-56 w-full", className)}>
      {variant === "bar" ? (
        <BarChart {...chartProps}>
          {shared}
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="total"
              fill={`var(--color-${key})`}
              radius={index === keys.length - 1 ? [3, 3, 0, 0] : 0}
              maxBarSize={28}
              isAnimationActive={animate}
            />
          ))}
        </BarChart>
      ) : variant === "area" ? (
        <AreaChart {...chartProps}>
          <defs>
            {keys.map((key) => (
              <linearGradient key={key} id={`${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.5} />
                <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {shared}
          {keys.map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="monotone"
              stackId="total"
              stroke={`var(--color-${key})`}
              fill={`url(#${gradientId}-${key})`}
              strokeWidth={2}
              isAnimationActive={animate}
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart {...chartProps}>
          {shared}
          {keys.map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={animate}
            />
          ))}
        </LineChart>
      )}
    </ChartContainer>
  );
}
