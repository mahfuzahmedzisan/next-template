"use client";

import { DonutChart } from "@/components/admin/charts/donut-chart";

export function ChecksDonut({
  passed,
  failed,
  onSelect,
  className,
}: {
  passed: number;
  failed: number;
  onSelect?: (key: "passed" | "failed") => void;
  className?: string;
}) {
  return (
    <DonutChart
      caption="checks"
      className={className}
      onSelect={onSelect ? (key) => onSelect(key as "passed" | "failed") : undefined}
      slices={[
        { key: "passed", label: "Passed", value: passed, color: "var(--score-good)" },
        { key: "failed", label: "Failed", value: failed, color: "var(--score-bad)" },
      ]}
    />
  );
}
