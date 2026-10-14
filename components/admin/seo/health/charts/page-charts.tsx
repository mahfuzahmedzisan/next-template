"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import { ChartEmpty, ChartPanel, useChartAnimation } from "@/components/admin/charts/chart-panel";
import { HorizontalBars } from "@/components/admin/charts/horizontal-bars";
import { scoreFill } from "@/components/admin/seo/health/health-meta";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SeoAuditPageRow } from "@/lib/admin/seo-audit-types";

const TOP = 10;

const BUCKETS = [
  { key: "low", label: "0–49", min: 0, max: 49, sample: 0 },
  { key: "poor", label: "50–69", min: 50, max: 69, sample: 50 },
  { key: "fair", label: "70–89", min: 70, max: 89, sample: 70 },
  { key: "good", label: "90–99", min: 90, max: 99, sample: 90 },
  { key: "perfect", label: "100", min: 100, max: 100, sample: 100 },
] as const;

const distributionConfig = { pages: { label: "Pages" } } satisfies ChartConfig;

/** Green under 75% of the budget, amber up to it, red over it. */
function budgetFill(value: number, limit: number) {
  if (value > limit) return "var(--score-bad)";
  if (value > limit * 0.75) return "var(--score-warn)";
  return "var(--score-good)";
}

function ScoreDistribution({ pages }: { pages: SeoAuditPageRow[] }) {
  const animate = useChartAnimation();
  const scored = pages.filter((page) => page.score !== null);
  const data = BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    pages: scored.filter((page) => (page.score ?? 0) >= bucket.min && (page.score ?? 0) <= bucket.max).length,
    fill: scoreFill(bucket.sample),
  }));

  if (scored.length === 0) return <ChartEmpty>No scored pages.</ChartEmpty>;

  return (
    <ChartContainer config={distributionConfig} className="aspect-auto h-48 w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 20 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator labelFormatter={(label) => `Score ${label}`} />} />
        <Bar dataKey="pages" radius={6} maxBarSize={72} isAnimationActive={animate}>
          <LabelList dataKey="pages" position="top" offset={6} className="fill-foreground tabular-nums" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function PageCharts({
  pages,
  limits,
}: {
  pages: SeoAuditPageRow[];
  limits: { ttfb_ms: number; max_html_kb: number };
}) {
  const slowest = pages
    .filter((page) => page.ttfb_ms !== null)
    .sort((a, b) => (b.ttfb_ms ?? 0) - (a.ttfb_ms ?? 0))
    .slice(0, TOP)
    .map((page) => ({
      key: String(page.id),
      label: page.label,
      hint: page.url,
      value: page.ttfb_ms ?? 0,
      fill: budgetFill(page.ttfb_ms ?? 0, limits.ttfb_ms),
    }));
  const heaviest = pages
    .filter((page) => page.html_bytes !== null)
    .sort((a, b) => (b.html_bytes ?? 0) - (a.html_bytes ?? 0))
    .slice(0, TOP)
    .map((page) => {
      const kb = Math.ceil((page.html_bytes ?? 0) / 1024);
      return { key: String(page.id), label: page.label, hint: page.url, value: kb, fill: budgetFill(kb, limits.max_html_kb) };
    });

  return (
    <div className="flex flex-col gap-4">
      <ChartPanel title="Score distribution" description="How many pages fall into each score band.">
        <ScoreDistribution pages={pages} />
      </ChartPanel>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Slowest pages" description={`Time to first byte, budget ${limits.ttfb_ms} ms.`}>
          {slowest.length > 0 ? (
            <HorizontalBars
              rows={slowest}
              valueLabel="TTFB"
              format={(value) => `${value} ms`}
              reference={{ value: limits.ttfb_ms, label: "Budget" }}
            />
          ) : (
            <ChartEmpty>No timing data.</ChartEmpty>
          )}
        </ChartPanel>
        <ChartPanel title="Heaviest pages" description={`HTML size, budget ${limits.max_html_kb} KB.`}>
          {heaviest.length > 0 ? (
            <HorizontalBars
              rows={heaviest}
              valueLabel="HTML"
              format={(value) => `${value} KB`}
              reference={{ value: limits.max_html_kb, label: "Budget" }}
            />
          ) : (
            <ChartEmpty>No size data.</ChartEmpty>
          )}
        </ChartPanel>
      </div>
    </div>
  );
}
