"use client";

import { ChevronLeft, ChevronRight, Globe, ScrollText } from "lucide-react";

import {
  actorLabel,
  CategoryIcon,
  deviceSummary,
  formatAuditTime,
  formatRelative,
  SeverityBadge,
  subjectLabel,
} from "@/components/admin/audit/audit-meta";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AuditEntry, AuditListMeta } from "@/lib/admin/audit-types";
import { cn } from "cn";

export function AuditList({
  entries,
  timeZone,
  now,
  filtered,
  onSelect,
}: {
  entries: AuditEntry[];
  timeZone: string;
  now: number;
  filtered: boolean;
  onSelect: (entry: AuditEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
          <ScrollText className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">{filtered ? "Nothing matches these filters" : "No activity yet"}</p>
          <p className="mx-auto max-w-sm text-xs leading-5 text-muted-foreground">
            {filtered
              ? "Try a wider date range or clear a filter."
              : "Sign-ins, settings changes, uploads and backups appear here as they happen."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
      {entries.map((entry) => {
        const subject = subjectLabel(entry);
        const device = deviceSummary(entry);
        const relative = formatRelative(entry.created_at, now);
        const absolute = formatAuditTime(entry.created_at, timeZone);

        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className={cn(
                "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
                entry.severity === "critical" && "bg-red-500/[0.03]",
              )}
            >
              <CategoryIcon entry={entry} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-medium">{entry.title}</p>
                  {entry.severity !== "info" ? <SeverityBadge severity={entry.severity} /> : null}
                  <span className="text-xs text-muted-foreground">{entry.category_label}</span>
                </div>
                <p className="truncate text-xs leading-5 text-muted-foreground">
                  <span className="font-medium text-foreground/80">{actorLabel(entry)}</span>
                  {subject && subject !== actorLabel(entry) ? <> · {subject}</> : null}
                  {entry.changed_fields.length > 0 ? (
                    <> · changed {entry.changed_fields.slice(0, 3).join(", ")}{entry.changed_fields.length > 3 ? ` +${entry.changed_fields.length - 3}` : ""}</>
                  ) : null}
                </p>
                {entry.ip_address || device ? (
                  <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                    <Globe className="size-3 shrink-0" aria-hidden />
                    {[entry.ip_address, device].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{relative ?? absolute}</span>
                </TooltipTrigger>
                <TooltipContent>{absolute}</TooltipContent>
              </Tooltip>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function AuditPagination({
  meta,
  pending,
  onPage,
}: {
  meta: AuditListMeta;
  pending: boolean;
  onPage: (page: number) => void;
}) {
  if (meta.total === 0) return null;

  const first = (meta.current_page - 1) * meta.per_page + 1;
  const last = Math.min(meta.total, meta.current_page * meta.per_page);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <p>
        {first.toLocaleString()}–{last.toLocaleString()} of {meta.total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        <span>
          Page {meta.current_page} of {meta.last_page}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={pending || meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={pending || meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
