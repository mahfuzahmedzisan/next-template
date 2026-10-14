"use client";

import { Loader2 } from "lucide-react";

import { ChartEmpty, ChartPanel } from "@/components/admin/charts/chart-panel";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { RangeToggle } from "@/components/admin/charts/range-toggle";
import { mediaKindConfig, mediaStatusLabels } from "@/components/admin/charts/stats-config";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import { useRangeData } from "@/components/admin/charts/use-range-data";
import type { MediaStatusKey } from "@/lib/admin/stats-types";
import { formatBytes } from "@/lib/file-upload";
import { cn } from "cn";

/** Statuses that need someone to look at them get a colour; the rest stay muted. */
const STATUS_TONE: Partial<Record<MediaStatusKey, string>> = {
  failed: "var(--score-bad)",
  awaiting_upload: "var(--score-warn)",
};

export default function MediaOverviewCharts({ refreshKey }: { refreshKey: number }) {
  const stats = useRangeData("media", null, { autoLoad: true, refreshKey });

  if (!stats.data) {
    return stats.error ? (
      <p className="text-sm text-destructive">{stats.error}</p>
    ) : (
      <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        Loading overview…
      </div>
    );
  }

  const { data } = stats;
  const slices = data.by_kind.map((kind) => ({
    key: kind.value,
    label: mediaKindConfig[kind.value].label,
    value: kind.bytes,
    color: mediaKindConfig[kind.value].color,
  }));

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-2 text-xs">
        {data.by_status.map((status) => {
          const tone = status.count > 0 ? STATUS_TONE[status.value] : undefined;
          return (
            <li
              key={status.value}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1",
                tone ? "font-medium" : "text-muted-foreground",
              )}
              style={tone ? { color: tone, borderColor: tone } : undefined}
            >
              {mediaStatusLabels[status.value]}
              <span className="tabular-nums">{status.count.toLocaleString()}</span>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartPanel title="Storage by kind" description={`${data.totals.count.toLocaleString()} files in total.`}>
          {data.totals.bytes > 0 ? (
            <DonutChart slices={slices} caption="stored" format={formatBytes} />
          ) : (
            <ChartEmpty>No stored media yet.</ChartEmpty>
          )}
        </ChartPanel>
        <ChartPanel
          className="lg:col-span-2"
          title="Uploads per day"
          description="New files by kind."
          action={<RangeToggle value={stats.days} onChange={stats.selectRange} pending={stats.pending} />}
        >
          <TrendChart data={data.uploads} config={mediaKindConfig} empty="No uploads in this range." />
          {stats.error ? <p className="text-xs text-destructive">{stats.error}</p> : null}
        </ChartPanel>
      </div>
    </div>
  );
}
