"use client";

import { Bar, BarChart, CartesianGrid, Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart, XAxis, YAxis } from "recharts";

import { formatSize, KIND_LABELS } from "@/components/admin/application/backups/backup-meta";
import { ChartEmpty, ChartPanel, useChartAnimation } from "@/components/admin/charts/chart-panel";
import { RangeToggle } from "@/components/admin/charts/range-toggle";
import { backupRunsConfig } from "@/components/admin/charts/stats-config";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { BackupEntry, BackupKind, BackupSummary } from "@/lib/admin/backups";
import type { BackupHistory, StatRange } from "@/lib/admin/stats-types";

const KIND_COLORS: Record<BackupKind, string> = {
  scheduled: "var(--chart-2)",
  manual: "var(--chart-1)",
  pre_restore: "var(--chart-4)",
};

const sizeConfig = { size: { label: "Size" } } satisfies ChartConfig;

function shortDate(value: string, timeZone: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone });
}

function BackupSizes({ backups, timeZone }: { backups: BackupEntry[]; timeZone: string }) {
  const animate = useChartAnimation();
  const data = [...backups].reverse().map((backup) => ({
    id: backup.id,
    kind: backup.kind,
    created_at: backup.created_at,
    size: backup.size,
    fill: KIND_COLORS[backup.kind],
  }));
  const kinds = (Object.keys(KIND_COLORS) as BackupKind[]).filter((kind) => data.some((row) => row.kind === kind));

  if (data.length === 0) return <ChartEmpty>No backups yet.</ChartEmpty>;

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={sizeConfig} className="aspect-auto h-56 w-full">
        <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="id"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(id: string) => {
              const row = data.find((item) => item.id === id);
              return row ? shortDate(row.created_at, timeZone) : "";
            }}
          />
          <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value: number) => formatSize(value)} />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  if (!row) return null;
                  const at = new Date(row.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone,
                  });
                  return `${KIND_LABELS[row.kind]} · ${at}`;
                }}
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums text-foreground">{formatSize(Number(value))}</span>
                )}
              />
            }
          />
          <Bar dataKey="size" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={animate} />
        </BarChart>
      </ChartContainer>
      <ul className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
        {kinds.map((kind) => (
          <li key={kind} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: KIND_COLORS[kind] }} aria-hidden />
            {KIND_LABELS[kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Green under 75% of the cap, amber up to it, red over it. */
function usageFill(percent: number) {
  if (percent > 100) return "var(--score-bad)";
  if (percent > 75) return "var(--score-warn)";
  return "var(--score-good)";
}

function StorageGauge({ used, max }: { used: number; max: number }) {
  const animate = useChartAnimation();
  const percent = Math.round((used / max) * 100);
  const config = { used: { label: "Used", color: usageFill(percent) } } satisfies ChartConfig;
  const data = [{ key: "used", used: Math.min(percent, 100), fill: "var(--color-used)" }];

  return (
    <div className="flex flex-col items-center gap-2">
      <ChartContainer
        config={config}
        className="aspect-square size-44"
        role="img"
        aria-label={`Storage used: ${percent}% of ${formatSize(max)}`}
      >
        <RadialBarChart data={data} startAngle={90} endAngle={-270} innerRadius={70} outerRadius={84}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar dataKey="used" background cornerRadius={10} isAnimationActive={animate} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                const cx = viewBox.cx ?? 0;
                const cy = viewBox.cy ?? 0;
                return (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={cx} y={cy - 6} className="fill-foreground text-3xl font-semibold tabular-nums">
                      {percent}%
                    </tspan>
                    <tspan x={cx} y={cy + 18} className="fill-muted-foreground text-xs">
                      of {formatSize(max)}
                    </tspan>
                  </text>
                );
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
      <p className="text-center text-xs text-muted-foreground">
        {formatSize(used)} used. Above the cap, cleanup deletes the oldest backups first.
      </p>
    </div>
  );
}

export function BackupCharts({
  backups,
  summary,
  timeZone,
  history,
  days,
  pending,
  error,
  onRange,
}: {
  backups: BackupEntry[];
  summary: BackupSummary;
  timeZone: string;
  history: BackupHistory | null;
  days: StatRange;
  pending: boolean;
  error: string | null;
  onRange: (range: StatRange) => void;
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartPanel className="lg:col-span-2" title="Backup size" description="Each stored backup, oldest to newest.">
          <BackupSizes backups={backups} timeZone={timeZone} />
        </ChartPanel>
        <ChartPanel title="Storage used" description="All stored backups against the storage cap.">
          {summary.max_storage_bytes ? (
            <StorageGauge used={summary.total_size} max={summary.max_storage_bytes} />
          ) : (
            <ChartEmpty>No storage cap is set; {formatSize(summary.total_size)} in use.</ChartEmpty>
          )}
        </ChartPanel>
      </div>

      {history ? (
        <ChartPanel
          title="Backup runs"
          description="Completed and failed backups per day."
          action={<RangeToggle value={days} onChange={onRange} pending={pending} maxDays={history.retention_days} />}
        >
          <TrendChart data={history.daily} config={backupRunsConfig} empty="No backups ran in this range." />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </ChartPanel>
      ) : null}
    </>
  );
}
