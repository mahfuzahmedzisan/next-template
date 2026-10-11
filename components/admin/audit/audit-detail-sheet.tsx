"use client";

import { ArrowRight, Link2, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import {
  actorLabel,
  CategoryIcon,
  deviceSummary,
  formatAuditTime,
  formatAuditValue,
  humanizeKey,
  ORIGIN_LABELS,
  SeverityBadge,
  subjectLabel,
} from "@/components/admin/audit/audit-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditDetail, AuditEntry } from "@/lib/admin/audit-types";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; detail: AuditDetail }
  | { status: "error"; message: string };

export function AuditDetailSheet({
  entry,
  timeZone,
  onClose,
  onShowRelated,
}: {
  entry: AuditEntry | null;
  timeZone: string;
  onClose: () => void;
  onShowRelated?: (requestId: string) => void;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const entryId = entry?.id ?? null;

  useEffect(() => {
    if (entryId === null) return;
    const controller = new AbortController();

    fetch(`/api/admin/audit/${entryId}`, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          | { data?: { activity?: AuditDetail }; message?: string }
          | null;
        if (!response.ok || !body?.data?.activity) {
          setState({ status: "error", message: body?.message ?? "This entry could not be loaded." });
          return;
        }
        setState({ status: "ready", detail: body.data.activity });
      })
      .catch((error: unknown) => {
        if ((error as Error).name === "AbortError") return;
        setState({ status: "error", message: "This entry could not be loaded." });
      });

    return () => {
      controller.abort();
      setState({ status: "loading" });
    };
  }, [entryId]);

  const detail = state.status === "ready" ? state.detail : null;

  return (
    <Sheet open={entry !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {entry ? (
          <>
            <SheetHeader className="gap-3 border-b border-border/70 p-6 pr-12">
              <div className="flex items-start gap-3">
                <CategoryIcon entry={entry} />
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="text-lg font-semibold">{entry.title}</SheetTitle>
                  <SheetDescription>{formatAuditTime(entry.created_at, timeZone)}</SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={entry.severity} />
                <Badge variant="outline">{entry.category_label}</Badge>
                {entry.event ? (
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{entry.event}</code>
                ) : null}
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-6">
              <Section title="Who and what">
                <Field label="Actor" value={actorLabel(entry)} hint={entry.causer?.type && entry.causer.id ? `${entry.causer.type} #${entry.causer.id}` : undefined} />
                <Field label="Subject" value={subjectLabel(entry) ?? "—"} hint={entry.subject?.type && entry.subject.id ? `${entry.subject.type} #${entry.subject.id}` : undefined} />
                <Field label="Summary" value={entry.description} />
              </Section>

              <Section title="Where">
                <Field label="IP address" value={entry.ip_address ?? "—"} mono />
                <Field label="Device" value={deviceSummary(entry) ?? "—"} />
                <Field label="Origin" value={entry.origin ? ORIGIN_LABELS[entry.origin] : "—"} />
                {detail?.user_agent ? <Field label="User agent" value={detail.user_agent} mono small /> : null}
                {entry.request_id ? (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground">Request</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="break-all text-xs">{entry.request_id}</code>
                      {detail && detail.related_count > 0 && onShowRelated ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onShowRelated(entry.request_id as string)}
                        >
                          <Link2 aria-hidden />
                          {detail.related_count} related {detail.related_count === 1 ? "entry" : "entries"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </Section>

              {state.status === "loading" ? (
                <div className="flex flex-col gap-2" aria-busy>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Loading details…
                  </span>
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : null}

              {state.status === "error" ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {state.message}
                </p>
              ) : null}

              {detail && detail.changes.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold">Changes</h4>
                  <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
                    {detail.changes.map((change) => (
                      <li key={change.field} className="flex flex-col gap-2 p-3">
                        <span className="text-xs font-medium text-muted-foreground">{change.label}</span>
                        <div className="grid items-start gap-2 sm:grid-cols-[1fr_auto_1fr]">
                          <Value tone="old">{formatAuditValue(change.old)}</Value>
                          <ArrowRight className="mt-2 hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
                          <Value tone="new">{formatAuditValue(change.new)}</Value>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {detail && Object.keys(detail.properties).length > 0 ? (
                <section className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold">Details</h4>
                  <dl className="divide-y divide-border/70 rounded-xl border border-border/70">
                    {Object.entries(detail.properties).map(([key, value]) => (
                      <div key={key} className="grid gap-1 p-3 sm:grid-cols-[10rem_1fr] sm:gap-3">
                        <dt className="text-xs font-medium text-muted-foreground">{humanizeKey(key)}</dt>
                        <dd className="whitespace-pre-wrap break-words text-sm">{formatAuditValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  hint,
  mono = false,
  small = false,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className={small ? "flex flex-col gap-1 sm:col-span-2" : "flex flex-col gap-1"}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`break-words ${mono ? "font-mono" : ""} ${small ? "text-xs leading-5" : "text-sm"}`}>{value}</span>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

function Value({ tone, children }: { tone: "old" | "new"; children: ReactNode }) {
  return (
    <span
      className={
        tone === "old"
          ? "whitespace-pre-wrap break-words rounded-lg bg-red-500/5 px-2.5 py-1.5 text-sm text-muted-foreground line-through decoration-red-500/40"
          : "whitespace-pre-wrap break-words rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-sm"
      }
    >
      {children}
    </span>
  );
}
