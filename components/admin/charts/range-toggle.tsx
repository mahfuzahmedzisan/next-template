"use client";

import { Loader2 } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { STAT_RANGES, type StatRange } from "@/lib/admin/stats-types";

export function retentionLabel(days: number) {
  if (days % 365 === 0) return days === 365 ? "1 year" : `${days / 365} years`;
  if (days % 30 === 0) return days === 30 ? "1 month" : `${days / 30} months`;
  return `${days} days`;
}

/**
 * 7 / 30 / 90-day switch. Ranges longer than `maxDays` (the audit retention)
 * are disabled, because entries that old are already deleted.
 */
export function RangeToggle({
  value,
  onChange,
  pending = false,
  maxDays,
}: {
  value: StatRange;
  onChange: (range: StatRange) => void;
  pending?: boolean;
  maxDays?: number | null;
}) {
  const note =
    maxDays != null && STAT_RANGES.some((range) => range > maxDays)
      ? `Audit entries are kept for ${retentionLabel(maxDays)}, so longer ranges are off.`
      : null;

  return (
    <div className="flex items-center gap-2">
      {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" /> : null}
      <Tabs value={String(value)} onValueChange={(next) => onChange(Number(next) as StatRange)}>
        <TabsList aria-label="Date range">
          {STAT_RANGES.map((range) => {
            const disabled = maxDays != null && range > maxDays;
            const trigger = (
              <TabsTrigger key={range} value={String(range)} disabled={disabled} className="tabular-nums">
                {range}d
              </TabsTrigger>
            );
            if (!disabled || !note) return trigger;

            // Disabled buttons get no pointer events, so the wrapper carries the hover.
            return (
              <Tooltip key={range}>
                <TooltipTrigger asChild>
                  <span className="inline-flex h-full flex-1 cursor-not-allowed items-center">{trigger}</span>
                </TooltipTrigger>
                <TooltipContent>{note}</TooltipContent>
              </Tooltip>
            );
          })}
        </TabsList>
      </Tabs>
      {note ? <span className="sr-only">{note}</span> : null}
    </div>
  );
}
