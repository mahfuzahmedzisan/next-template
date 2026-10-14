"use client";

import { Label, Pie, PieChart } from "recharts";

import { useChartAnimation } from "@/components/admin/charts/chart-panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "cn";

export type DonutSlice = { key: string; label: string; value: number; color: string };

/**
 * A donut with the total in the middle; zero-value slices are left out.
 * With `onSelect`, slices and legend items become buttons. `format` changes
 * how values and the total read (bytes, for example).
 */
export function DonutChart({
  slices,
  caption,
  onSelect,
  selected,
  format,
  className,
}: {
  slices: DonutSlice[];
  caption: string;
  onSelect?: (key: string) => void;
  selected?: string | null;
  format?: (value: number) => string;
  className?: string;
}) {
  const animate = useChartAnimation();
  const config = Object.fromEntries(slices.map((slice) => [slice.key, { label: slice.label, color: slice.color }])) satisfies ChartConfig;
  const data = slices.filter((slice) => slice.value > 0).map((slice) => ({ ...slice, fill: `var(--color-${slice.key})` }));
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const show = format ?? ((value: number) => value.toLocaleString());

  return (
    <div className={cn("mx-auto flex w-full max-w-60 flex-col gap-2", className)}>
      <ChartContainer config={config} className="aspect-square w-full">
        <PieChart accessibilityLayer>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="key"
                formatter={
                  format
                    ? (value, _name, item) => (
                        <>
                          <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: item.payload?.color }} aria-hidden />
                          <span className="flex-1 text-muted-foreground">{item.payload?.label}</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">{format(Number(value))}</span>
                        </>
                      )
                    : undefined
                }
              />
            }
          />
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
                      {show(total)}
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
              <span className="tabular-nums text-muted-foreground">{show(slice.value)}</span>
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
