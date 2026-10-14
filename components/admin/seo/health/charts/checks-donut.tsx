"use client";

import { Label, Pie, PieChart } from "recharts";

import { useChartAnimation } from "@/components/admin/seo/health/charts/chart-panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "cn";

export type DonutSlice = { key: string; label: string; value: number; color: string };

/**
 * A donut with the total in the middle; zero-value slices are left out.
 * With `onSelect`, slices and legend items become buttons.
 */
export function DonutChart({
  slices,
  caption,
  onSelect,
  selected,
  className,
}: {
  slices: DonutSlice[];
  caption: string;
  onSelect?: (key: string) => void;
  selected?: string | null;
  className?: string;
}) {
  const animate = useChartAnimation();
  const config = Object.fromEntries(slices.map((slice) => [slice.key, { label: slice.label, color: slice.color }])) satisfies ChartConfig;
  const data = slices.filter((slice) => slice.value > 0).map((slice) => ({ ...slice, fill: `var(--color-${slice.key})` }));
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className={cn("mx-auto flex w-full max-w-60 flex-col gap-2", className)}>
      <ChartContainer config={config} className="aspect-square w-full">
        <PieChart accessibilityLayer>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius="64%"
            strokeWidth={4}
            isAnimationActive={animate}
            className={onSelect ? "cursor-pointer" : undefined}
            onClick={onSelect ? (_, index) => onSelect(data[index].key) : undefined}
          >
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
        </PieChart>
      </ChartContainer>

      <ul className="-mx-6 flex flex-wrap justify-center gap-1 text-xs">
        {data.map((slice) => {
          const content = (
            <>
              <span className="size-2 shrink-0 rounded-[2px]" style={{ background: slice.color }} aria-hidden />
              {slice.label}
              <span className="tabular-nums text-muted-foreground">{slice.value.toLocaleString()}</span>
            </>
          );
          return (
            <li key={slice.key}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(slice.key)}
                  aria-pressed={selected === undefined ? undefined : selected === slice.key}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected === slice.key && "bg-muted",
                  )}
                >
                  {content}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-1">{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ChecksDonut({
  passed,
  failed,
  onSelect,
  className,
}: {
  passed: number;
  failed: number;
  onSelect?: (key: "passed" | "failed") => void;
  className?: string;
}) {
  return (
    <DonutChart
      caption="checks"
      className={className}
      onSelect={onSelect ? (key) => onSelect(key as "passed" | "failed") : undefined}
      slices={[
        { key: "passed", label: "Passed", value: passed, color: "var(--score-good)" },
        { key: "failed", label: "Failed", value: failed, color: "var(--score-bad)" },
      ]}
    />
  );
}
