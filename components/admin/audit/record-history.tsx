"use client";

import { ChevronDown, History, Loader2 } from "lucide-react";
import { useState } from "react";

import { ActivityTimeline } from "@/components/admin/audit/activity-timeline";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { Button } from "@/components/ui/button";
import type { AuditEntry, AuditListResult } from "@/lib/admin/audit-types";

const PER_PAGE = 10;

type Feed = { entries: AuditEntry[]; page: number; lastPage: number; total: number };

/**
 * Change history of one record, loaded on demand. `subject` is the audit
 * subject alias plus id, for example `media:42`.
 */
export function RecordHistory({ subject, title = "History" }: { subject: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(page: number) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ subject, per_page: String(PER_PAGE) });
      if (page > 1) params.set("page", String(page));
      const response = await fetch(`/api/admin/audit?${params}`, { headers: { Accept: "application/json" } });
      const body = (await response.json().catch(() => null)) as { data?: AuditListResult; message?: string } | null;
      if (!response.ok || !body?.data) {
        setError(body?.message ?? "History could not be loaded.");
        return;
      }
      const data = body.data;
      setFeed((current) => ({
        entries: page === 1 || !current ? data.activities : [...current.entries, ...data.activities],
        page: data.meta.current_page,
        lastPage: data.meta.last_page,
        total: data.meta.total,
      }));
    } catch {
      setError("History could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !feed && !loading) void load(1);
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border/70 p-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" aria-hidden />
          {title}
          {feed ? <span className="text-xs font-normal text-muted-foreground">{feed.total}</span> : null}
        </span>
        <ChevronDown
          className={open ? "size-4 rotate-180 text-muted-foreground transition-transform" : "size-4 text-muted-foreground transition-transform"}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3">
          {loading && !feed ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Loading history…
            </p>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {feed ? (
            <ActivityTimeline
              entries={feed.entries}
              dense
              emptyTitle="No history yet"
              emptyText="Edits, uploads and processing events for this item appear here."
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {feed && feed.page < feed.lastPage ? (
              <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load(feed.page + 1)}>
                {loading ? "Loading…" : "Show older"}
              </Button>
            ) : null}
            {feed && feed.total > 0 ? (
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href={`/admin/application/audit?subject=${encodeURIComponent(subject)}`}>Open in audit log</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
