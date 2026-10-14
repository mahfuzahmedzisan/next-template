"use client";

import { History } from "lucide-react";
import { useEffect, useState } from "react";

import {
  actorLabel,
  CategoryIcon,
  deviceSummary,
  formatAuditTime,
  formatRelative,
  SeverityBadge,
  subjectLabel,
} from "@/components/admin/audit/audit-meta";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AuditEntry } from "@/lib/admin/audit-types";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";
import { cn } from "cn";

const CLOCK_MS = 60_000;

/**
 * A vertical feed of audit entries. Used for a user's own history, a record's
 * change history, and short "recent activity" lists.
 */
export function ActivityTimeline({
  entries,
  showActor = true,
  showSubject = false,
  dense = false,
  emptyTitle = "No activity yet",
  emptyText = "Actions appear here as they happen.",
  onSelect,
}: {
  entries: AuditEntry[];
  showActor?: boolean;
  showSubject?: boolean;
  dense?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  onSelect?: (entry: AuditEntry) => void;
}) {
  const timeZone = useDisplayTimeZone();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-8 text-center">
        <span className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
          <History className="size-4 text-muted-foreground" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="mx-auto max-w-sm text-xs leading-5 text-muted-foreground">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col">
      {entries.map((entry, index) => {
        const absolute = formatAuditTime(entry.created_at, timeZone);
        const relative = formatRelative(entry.created_at, now);
        const subject = showSubject ? subjectLabel(entry) : null;
        const device = deviceSummary(entry);
        const meta = [
          showActor ? actorLabel(entry) : null,
          subject,
          entry.changed_fields.length > 0 ? `changed ${entry.changed_fields.join(", ")}` : null,
        ].filter(Boolean);
        const where = [entry.ip_address, device].filter(Boolean).join(" · ");
        const last = index === entries.length - 1;

        const body = (
          <>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-medium">{entry.title}</p>
              {entry.severity === "warning" || entry.severity === "critical" ? (
                <SeverityBadge severity={entry.severity} />
              ) : null}
            </div>
            {meta.length > 0 ? (
              <p className="text-xs leading-5 text-muted-foreground">{meta.join(" · ")}</p>
            ) : null}
            <p className="text-[11px] leading-5 text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <time dateTime={entry.created_at} suppressHydrationWarning>{relative ?? absolute}</time>
                </TooltipTrigger>
                <TooltipContent>{absolute}</TooltipContent>
              </Tooltip>
              {where ? <> · {where}</> : null}
            </p>
          </>
        );

        return (
          <li key={entry.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <CategoryIcon entry={entry} className={dense ? "size-8 rounded-lg" : undefined} />
              {!last ? <span className="my-1 w-px flex-1 bg-border/80" aria-hidden /> : null}
            </div>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className={cn(
                  "-mx-2 mb-1 flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-2 text-left transition-colors hover:bg-muted/40",
                  dense ? "py-1" : "py-1.5",
                  !last && (dense ? "mb-2" : "mb-3"),
                )}
              >
                {body}
              </button>
            ) : (
              <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", dense ? "pt-1" : "pt-1.5", !last && (dense ? "pb-3" : "pb-5"))}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
