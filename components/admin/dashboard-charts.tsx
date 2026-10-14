"use client";

import Link from "next/link";

import { ChartEmpty, ChartPanel } from "@/components/admin/charts/chart-panel";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { RangeToggle } from "@/components/admin/charts/range-toggle";
import { categoryConfig, mediaKindConfig, personalCategoryConfig, signInConfig } from "@/components/admin/charts/stats-config";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import { useRangeData } from "@/components/admin/charts/use-range-data";
import type { AuditTrend, MediaStats, ProfileActivityStats } from "@/lib/admin/stats-types";
import { formatBytes } from "@/lib/file-upload";

function RangeError({ message }: { message: string | null }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function MediaLibraryPanel({ media }: { media: MediaStats }) {
  const slices = media.by_kind.map((kind) => ({
    key: kind.value,
    label: mediaKindConfig[kind.value].label,
    value: kind.bytes,
    color: mediaKindConfig[kind.value].color,
  }));

  return (
    <ChartPanel
      title="Media library"
      description={`${media.totals.count.toLocaleString()} file${media.totals.count === 1 ? "" : "s"}, storage by kind.`}
      action={
        <Link href="/admin/media" className="text-sm font-medium text-primary hover:underline">
          Open library
        </Link>
      }
    >
      {media.totals.bytes > 0 ? (
        <DonutChart slices={slices} caption="stored" format={formatBytes} />
      ) : (
        <ChartEmpty>No stored media yet.</ChartEmpty>
      )}
    </ChartPanel>
  );
}

export function AdminDashboardCharts({ audit, media }: { audit: AuditTrend | null; media: MediaStats | null }) {
  const trend = useRangeData("audit", audit);

  return (
    <>
      {trend.data ? (
        <ChartPanel
          title="Activity"
          description={`Audit events per day by category, last ${trend.data.days} days.`}
          action={
            <RangeToggle
              value={trend.days}
              onChange={trend.selectRange}
              pending={trend.pending}
              maxDays={trend.data.retention_days}
            />
          }
        >
          <TrendChart data={trend.data.daily_categories} config={categoryConfig} />
          <RangeError message={trend.error} />
        </ChartPanel>
      ) : null}

      {trend.data || media ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {trend.data ? (
            <ChartPanel title="Sign-ins" description={`Succeeded and failed sign-ins, last ${trend.data.days} days.`}>
              <TrendChart data={trend.data.sign_ins} config={signInConfig} variant="line" empty="No sign-ins in this range." />
            </ChartPanel>
          ) : null}
          {media ? <MediaLibraryPanel media={media} /> : null}
        </div>
      ) : null}
    </>
  );
}

export function PersonalDashboardChart({ stats }: { stats: ProfileActivityStats | null }) {
  const trend = useRangeData("profile", stats);
  if (!trend.data) return null;

  return (
    <ChartPanel
      title="Your activity"
      description={`Your sign-ins, security and account changes, last ${trend.data.days} days.`}
      action={
        <RangeToggle
          value={trend.days}
          onChange={trend.selectRange}
          pending={trend.pending}
          maxDays={trend.data.retention_days}
        />
      }
    >
      <TrendChart data={trend.data.daily} config={personalCategoryConfig} />
      <RangeError message={trend.error} />
    </ChartPanel>
  );
}
