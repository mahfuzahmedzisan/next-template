"use client";

import { Loader2 } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STAT_RANGES, type StatRange } from "@/lib/admin/stats-types";

export function RangeToggle({
  value,
  onChange,
  pending = false,
}: {
  value: StatRange;
  onChange: (range: StatRange) => void;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" /> : null}
      <Tabs value={String(value)} onValueChange={(next) => onChange(Number(next) as StatRange)}>
        <TabsList aria-label="Date range">
          {STAT_RANGES.map((range) => (
            <TabsTrigger key={range} value={String(range)} className="tabular-nums">
              {range}d
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
