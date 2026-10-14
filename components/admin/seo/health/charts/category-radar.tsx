"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";

import { useChartAnimation } from "@/components/admin/charts/chart-panel";
import { ScoreBars } from "@/components/admin/seo/health/charts/score-bars";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SeoAuditCheck, SeoCheckCategory } from "@/lib/admin/seo-audit-types";
import { cn } from "cn";

export type CategoryScore = { key: string; label: string; score: number };

const config = { score: { label: "Score", color: "var(--chart-2)" } } satisfies ChartConfig;

/** Category scores as a radar; with fewer than three axes a radar says nothing, so it falls back to bars. */
export function CategoryRadar({ categories, className }: { categories: CategoryScore[]; className?: string }) {
  const animate = useChartAnimation();

  if (categories.length < 3) {
    return (
      <ScoreBars
        rows={categories.map((category) => ({ key: category.key, label: category.label, value: category.score }))}
        valueLabel="Score"
        max={100}
      />
    );
  }

  return (
    <ChartContainer config={config} className={cn("mx-auto aspect-square w-full max-w-80", className)}>
      <RadarChart accessibilityLayer data={categories} outerRadius="62%" margin={{ left: 32, right: 32 }}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="score"
          fill="var(--color-score)"
          stroke="var(--color-score)"
          fillOpacity={0.35}
          dot={{ r: 3, fillOpacity: 1 }}
          isAnimationActive={animate}
        />
      </RadarChart>
    </ChartContainer>
  );
}

/** Weighted category scores of one page, from its scored checks. */
export function categoryScoresFromChecks(checks: SeoAuditCheck[], labels: Record<SeoCheckCategory, string>): CategoryScore[] {
  const totals = new Map<SeoCheckCategory, { total: number; passed: number }>();

  for (const check of checks) {
    if (!check.counted || check.weight <= 0) continue;
    const entry = totals.get(check.category) ?? { total: 0, passed: 0 };
    entry.total += check.weight;
    if (check.passed) entry.passed += check.weight;
    totals.set(check.category, entry);
  }

  return (Object.keys(labels) as SeoCheckCategory[]).flatMap((key) => {
    const entry = totals.get(key);
    return entry && entry.total > 0 ? [{ key, label: labels[key], score: Math.round((entry.passed / entry.total) * 100) }] : [];
  });
}
