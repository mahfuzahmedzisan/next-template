"use client";

import { Clock } from "lucide-react";

import { ActivityTimeline } from "@/components/admin/audit/activity-timeline";
import { MyActivityChart } from "@/components/admin/audit/my-activity-chart";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { Button } from "@/components/ui/button";
import type { AuditListResult } from "@/lib/admin/audit-types";
import type { ProfileActivityStats } from "@/lib/admin/stats-types";
import { cn } from "cn";

const FILTERS = [
  { value: "", label: "All" },
  { value: "auth", label: "Sign-in" },
  { value: "security", label: "Security" },
  { value: "account", label: "Account" },
  { value: "users", label: "Profile changes" },
] as const;

function hrefFor(category: string, page = 1) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/admin/activity?${params}` : "/admin/activity";
}

export function MyActivity({
  result,
  stats,
  category,
  retentionNote,
}: {
  result: AuditListResult;
  stats: ProfileActivityStats | null;
  category: string;
  retentionNote: string;
}) {
  const { activities, meta } = result;

  return (
    <div className="flex flex-col gap-5">
      <MyActivityChart initial={stats} />

      <nav aria-label="Activity filter" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={hrefFor(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter.value === category
                ? "border-foreground/20 bg-foreground text-background"
                : "border-border/70 text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <ActivityTimeline
        entries={activities}
        showActor
        emptyTitle={category ? "Nothing in this category" : "No activity yet"}
        emptyText="Sign-ins, password and two-factor changes, and edits to your account appear here."
      />

      {meta.last_page > 1 ? (
        <nav aria-label="Activity pages" className="flex items-center justify-between gap-3 text-sm">
          {meta.current_page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={hrefFor(category, meta.current_page - 1)}>Newer</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          {meta.current_page < meta.last_page ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={hrefFor(category, meta.current_page + 1)}>Older</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <p>{retentionNote}</p>
      </div>
    </div>
  );
}
