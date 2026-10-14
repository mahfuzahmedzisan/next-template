"use client";

import { ChartEmpty, ChartPanel } from "@/components/admin/charts/chart-panel";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { RangeToggle } from "@/components/admin/charts/range-toggle";
import { categoryConfig, severityConfig } from "@/components/admin/charts/stats-config";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import type { AuditTrend, StatRange } from "@/lib/admin/stats-types";

export function AuditCharts({
  trend,
  days,
  pending,
  error,
  selectedCategory,
  onRange,
  onSelectDay,
  onSelectCategory,
}: {
  trend: AuditTrend;
  days: StatRange;
  pending: boolean;
  error: string | null;
  selectedCategory: string | null;
  onRange: (range: StatRange) => void;
  onSelectDay: (date: string) => void;
  onSelectCategory: (category: string) => void;
}) {
  const slices = trend.by_category.map((category) => ({
    key: category.value,
    label: categoryConfig[category.value].label,
    value: category.count,
    color: categoryConfig[category.value].color,
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartPanel
        className="lg:col-span-2"
        title="Events per day"
        description="By severity. Select a day to list only its entries."
        action={<RangeToggle value={days} onChange={onRange} pending={pending} maxDays={trend.retention_days} />}
      >
        <TrendChart data={trend.daily} config={severityConfig} onSelectDay={onSelectDay} />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </ChartPanel>
      <ChartPanel title="By category" description={`Last ${trend.days} days. Select one to filter.`}>
        {total > 0 ? (
          <DonutChart slices={slices} caption="events" onSelect={onSelectCategory} selected={selectedCategory} />
        ) : (
          <ChartEmpty>Nothing recorded in this range.</ChartEmpty>
        )}
      </ChartPanel>
    </div>
  );
}
