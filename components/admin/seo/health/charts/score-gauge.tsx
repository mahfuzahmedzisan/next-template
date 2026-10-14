"use client";

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { useChartAnimation } from "@/components/admin/charts/chart-panel";
import { scoreFill } from "@/components/admin/seo/health/health-meta";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "cn";

const SIZES = {
  lg: { box: "size-44", outer: 84, inner: 70, value: "text-4xl", caption: 22 },
  sm: { box: "size-16", outer: 31, inner: 25, value: "text-sm", caption: 0 },
} as const;

/** A 0–100 ring coloured like the score, with the value in the middle. */
export function ScoreGauge({
  score,
  label,
  size = "lg",
  className,
}: {
  score: number | null;
  label: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const animate = useChartAnimation();
  const dims = SIZES[size];
  const config = { score: { label, color: scoreFill(score) } } satisfies ChartConfig;
  const data = [{ key: "score", score: score ?? 0, fill: "var(--color-score)" }];

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-square shrink-0", dims.box, className)}
      role="img"
      aria-label={`${label}: ${score === null ? "not scored" : `${score}%`}`}
    >
      <RadialBarChart data={data} startAngle={90} endAngle={-270} innerRadius={dims.inner} outerRadius={dims.outer}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        <RadialBar dataKey="score" background cornerRadius={size === "lg" ? 10 : 4} isAnimationActive={animate} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
              const cx = viewBox.cx ?? 0;
              const cy = viewBox.cy ?? 0;
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={cx} y={dims.caption ? cy - 6 : cy} className={cn("fill-foreground font-semibold tabular-nums", dims.value)}>
                    {score === null ? "—" : `${score}%`}
                  </tspan>
                  {dims.caption ? (
                    <tspan x={cx} y={cy + dims.caption} className="fill-muted-foreground text-xs">
                      {label}
                    </tspan>
                  ) : null}
                </text>
              );
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}
