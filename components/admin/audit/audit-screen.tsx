"use client";

import { Activity, AlertTriangle, Clock, Download, LogIn, Radio, RefreshCw, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { ApplicationSectionHeader } from "@/components/admin/application/application-settings";
import { AuditCharts } from "@/components/admin/audit/audit-charts";
import { AuditDetailSheet } from "@/components/admin/audit/audit-detail-sheet";
import { AuditFiltersBar, type AuditFilters } from "@/components/admin/audit/audit-filters";
import { AuditList, AuditPagination } from "@/components/admin/audit/audit-list";
import { formatAuditTime, zonedDayBoundary } from "@/components/admin/audit/audit-meta";
import { useAuditLive } from "@/components/admin/audit/use-audit-live";
import { retentionLabel } from "@/components/admin/charts/range-toggle";
import { useRangeData } from "@/components/admin/charts/use-range-data";
import { Button } from "@/components/ui/button";
import type { AuditEntry, AuditListResult, AuditOverview } from "@/lib/admin/audit-types";
import type { AuditTrend } from "@/lib/admin/stats-types";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";

const AUDIT_PATH = "/admin/application/audit";
const CLOCK_MS = 30_000;

export function AuditScreen({
  overview,
  list,
  filters,
  trend: initialTrend,
  exportError,
}: {
  overview: AuditOverview;
  list: AuditListResult;
  filters: AuditFilters;
  trend: AuditTrend | null;
  exportError: string | null;
}) {
  const router = useRouter();
  const timeZone = useDisplayTimeZone();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const live = useAuditLive();
  const { clear: clearLive } = live;
  const trend = useRangeData("audit", initialTrend);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    return params;
  }, [filters]);

  const filtered = query.size > 0;
  const fresh = live.fresh.filter((entry) => !list.activities.some((row) => row.id === entry.id));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!exportError) return;
    toast.error(exportError, { duration: 5000 });
    const params = new URLSearchParams(query);
    router.replace(params.size ? `${AUDIT_PATH}?${params}` : AUDIT_PATH, { scroll: false });
  }, [exportError, query, router]);

  const navigate = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        router.replace(params.size ? `${AUDIT_PATH}?${params}` : AUDIT_PATH, { scroll: false });
      });
    },
    [router],
  );

  const applyFilters = useCallback(
    (patch: AuditFilters) => {
      const params = new URLSearchParams(query);
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      navigate(params);
    },
    [navigate, query],
  );

  function goToPage(page: number) {
    const params = new URLSearchParams(query);
    if (page > 1) params.set("page", String(page));
    navigate(params);
  }

  function reload() {
    clearLive();
    setNow(Date.now());
    trend.reload();
    startTransition(() => router.refresh());
  }

  function filterDay(day: string) {
    const zone = trend.data?.timezone ?? timeZone;
    applyFilters({
      from: zonedDayBoundary(day, zone) ?? undefined,
      to: zonedDayBoundary(day, zone, true) ?? undefined,
    });
  }

  function filterCategory(category: string) {
    applyFilters({ category: filters.category === category ? undefined : category });
  }

  const exportHref = `/api/admin/audit/export${query.size ? `?${query}` : ""}`;
  const { stats } = overview;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ApplicationSectionHeader section="audit">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reload} disabled={pending}>
            <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden />
            Refresh
          </Button>
          {list.meta.total === 0 ? (
            <Button disabled>
              <Download aria-hidden />
              Export CSV
            </Button>
          ) : (
            <Button asChild>
              <a href={exportHref} download>
                <Download aria-hidden />
                Export CSV
              </a>
            </Button>
          )}
        </div>
      </ApplicationSectionHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Activity} label="Last 24 hours" value={stats.last_24_hours.toLocaleString()}>
          {stats.last_7_days.toLocaleString()} in the last 7 days
        </Stat>
        <Stat
          icon={AlertTriangle}
          label="Needs attention"
          value={stats.elevated_7_days.toLocaleString()}
          action={stats.elevated_7_days > 0 ? () => applyFilters({ severity: "warning,critical" }) : undefined}
        >
          Warning and critical, last 7 days
        </Stat>
        <Stat
          icon={LogIn}
          label="Failed sign-ins"
          value={stats.failed_sign_ins_24_hours.toLocaleString()}
          action={stats.failed_sign_ins_24_hours > 0 ? () => applyFilters({ category: "auth", severity: "warning" }) : undefined}
        >
          Wrong passwords, codes and throttling, 24 hours
        </Stat>
        <Stat icon={Clock} label="Retention" value={retentionLabel(overview.retention_days)}>
          {stats.oldest_at ? `Oldest entry ${formatAuditTime(stats.oldest_at, timeZone)}` : "Nothing stored yet"}
        </Stat>
      </div>

      {trend.data ? (
        <AuditCharts
          trend={trend.data}
          days={trend.days}
          pending={trend.pending}
          error={trend.error}
          selectedCategory={filters.category ?? null}
          onRange={trend.selectRange}
          onSelectDay={filterDay}
          onSelectCategory={filterCategory}
        />
      ) : null}

      <section className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">Activity</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Newest first. Select an entry to see who did it, from where, and what changed.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground"
            title={live.connected ? "New entries are announced as they happen." : "Live updates are not connected."}
          >
            <Radio className={live.connected ? "size-3.5 text-emerald-500" : "size-3.5"} aria-hidden />
            {live.connected ? "Live" : "Offline"}
          </span>
        </div>

        <AuditFiltersBar filters={filters} options={overview.options} timeZone={timeZone} onChange={applyFilters} />

        {fresh.length > 0 ? (
          <button
            type="button"
            onClick={reload}
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            {fresh.length === 1 ? "1 new entry" : `${fresh.length} new entries`} · Show
          </button>
        ) : null}

        <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={pending}>
          <AuditList
            entries={list.activities}
            timeZone={timeZone}
            now={now}
            filtered={filtered}
            onSelect={setSelected}
          />
        </div>

        <AuditPagination meta={list.meta} pending={pending} onPage={goToPage} />
      </section>

      <AuditDetailSheet
        entry={selected}
        timeZone={timeZone}
        onClose={() => setSelected(null)}
        onShowRelated={(requestId) => {
          setSelected(null);
          applyFilters({ request_id: requestId });
        }}
      />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  action,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  action?: () => void;
  children?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <div className="text-xs leading-5 text-muted-foreground">{children}</div>
    </>
  );

  if (action) {
    return (
      <button
        type="button"
        onClick={action}
        className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-4 text-left transition-colors hover:border-border hover:bg-muted/40"
      >
        {body}
      </button>
    );
  }

  return <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-4">{body}</div>;
}
