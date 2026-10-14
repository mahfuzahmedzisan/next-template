"use client";

import { RangeToggle } from "@/components/admin/charts/range-toggle";
import { personalCategoryConfig, severityConfig } from "@/components/admin/charts/stats-config";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import { useRangeData } from "@/components/admin/charts/use-range-data";
import type { AuditSeverityKey, ProfileActivityStats } from "@/lib/admin/stats-types";

const SEVERITIES: AuditSeverityKey[] = ["info", "notice", "warning", "critical"];
const HIGHLIGHT = new Set<AuditSeverityKey>(["warning", "critical"]);

export function MyActivityChart({ initial }: { initial: ProfileActivityStats | null }) {
  const stats = useRangeData("profile", initial);
  if (!stats.data) return null;

  const totals = stats.data.severity_totals;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {SEVERITIES.map((severity, index) => {
            const count = totals[severity];
            const strong = HIGHLIGHT.has(severity) && count > 0;
            return (
              <span key={severity}>
                {index > 0 ? " · " : null}
                <span
                  className={strong ? "font-medium" : undefined}
                  style={strong ? { color: severityConfig[severity].color } : undefined}
                >
                  <span className="tabular-nums">{count.toLocaleString()}</span> {severityConfig[severity].label.toLowerCase()}
                </span>
              </span>
            );
          })}
          <span> in the last {stats.data.days} days</span>
        </p>
        <RangeToggle
          value={stats.days}
          onChange={stats.selectRange}
          pending={stats.pending}
          maxDays={stats.data.retention_days}
        />
      </div>
      <TrendChart data={stats.data.daily} config={personalCategoryConfig} legend={false} className="h-40" />
      {stats.error ? <p className="text-xs text-destructive">{stats.error}</p> : null}
    </div>
  );
}
