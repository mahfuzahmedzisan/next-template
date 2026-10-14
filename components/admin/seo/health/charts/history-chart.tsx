"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { ChartEmpty, useChartAnimation } from "@/components/admin/charts/chart-panel";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SeoAuditRow, SeoAuditSection } from "@/lib/admin/seo-audit-types";

const TARGET = 90;
const SECTION_KEYS: SeoAuditSection[] = ["pages", "site", "sitemap", "robots"];

const scoreConfig = { score: { label: "Site score", color: "var(--chart-2)" } } satisfies ChartConfig;
const sectionConfig = {
  pages: { label: "Pages", color: "var(--chart-1)" },
  site: { label: "Site", color: "var(--chart-2)" },
  sitemap: { label: "Sitemap", color: "var(--chart-3)" },
  robots: { label: "robots.txt", color: "var(--chart-4)" },
} satisfies ChartConfig;

type Point = {
  key: string;
  at: string | null;
  development: boolean;
  scope: SeoAuditRow["scope"];
  pages: number;
  score: number | null;
} & Partial<Record<SeoAuditSection, number | null>>;

type View = "score" | "sections";

function toPoint(audit: SeoAuditRow): Point {
  const sections = Object.fromEntries((audit.sections ?? []).map((section) => [section.key, section.score]));
  return {
    key: String(audit.id),
    at: audit.finished_at ?? audit.created_at,
    development: audit.environment === "development",
    scope: audit.scope ?? "full",
    pages: audit.pages_total,
    score: audit.score,
    ...sections,
  };
}

/** Filled dots for production scans, hollow ones for development scans. */
function ScanDot(props: { cx?: number; cy?: number; payload?: Point; stroke?: string; index?: number }) {
  const { cx, cy, payload, stroke } = props;
  if (cx === undefined || cy === undefined || !payload || payload.score === null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      stroke={stroke}
      strokeWidth={2}
      fill={payload.development ? "var(--background)" : stroke}
    />
  );
}

export function HistoryChart({ audits, timeZone }: { audits: SeoAuditRow[]; timeZone: string }) {
  const animate = useChartAnimation();
  const [view, setView] = useState<View>("score");
  const points = audits
    .filter((audit) => audit.status === "completed")
    .map(toPoint)
    .reverse();
  const scorePoints = points.filter((point) => point.scope === "full" && point.score !== null);
  const data = view === "score" ? scorePoints : points;

  const times = data.flatMap((point) => (point.at ? [new Date(point.at).getTime()] : []));
  const sameDays = times.length > 0 && Math.max(...times) - Math.min(...times) < 2 * 24 * 60 * 60 * 1000;
  const tick = (key: string) => {
    const at = points.find((point) => point.key === key)?.at;
    if (!at) return "";
    return sameDays
      ? new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone })
      : new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone });
  };
  const tooltipLabel = (_: unknown, payload: readonly { payload?: Point }[] | undefined) => {
    const point = payload?.[0]?.payload;
    if (!point) return null;
    const scope = point.scope === "full" ? `${point.pages} page${point.pages === 1 ? "" : "s"}` : `${point.scope} only`;
    return `${formatDateTime(point.at, timeZone)} · ${scope}${point.development ? " · development" : ""}`;
  };

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={tick} />
      <YAxis domain={[0, 100]} ticks={[0, 50, TARGET, 100]} tickLine={false} axisLine={false} width={32} />
      <ReferenceLine
        y={TARGET}
        stroke="var(--muted-foreground)"
        strokeDasharray="4 4"
        label={{ value: "Target", position: "insideTopLeft", className: "fill-muted-foreground text-[10px]" }}
      />
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={view} onValueChange={(value) => setView(value as View)}>
        <TabsList>
          <TabsTrigger value="score">Site score</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>
      </Tabs>

      {data.length < 2 ? (
        <ChartEmpty>
          {view === "score"
            ? "Run another full audit to see the score trend."
            : "Run another audit to see how each section changes."}
        </ChartEmpty>
      ) : view === "score" ? (
        <ChartContainer config={scoreConfig} className="aspect-auto h-56 w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 12 }}>
            <defs>
              <linearGradient id="seo-history-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            {axes}
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" labelFormatter={tooltipLabel} />} />
            <Area
              dataKey="score"
              type="monotone"
              fill="url(#seo-history-fill)"
              stroke="var(--color-score)"
              strokeWidth={2}
              dot={<ScanDot />}
              activeDot={{ r: 5 }}
              isAnimationActive={animate}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <ChartContainer config={sectionConfig} className="aspect-auto h-64 w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 12 }}>
            {axes}
            <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={tooltipLabel} />} />
            {SECTION_KEYS.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                isAnimationActive={animate}
              />
            ))}
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      )}

      <p className="text-xs text-muted-foreground">
        Dashed line: the 90% target. Hollow dots are development scans, whose performance numbers are not representative.
      </p>
    </div>
  );
}
