"use client";

import { CheckCircle2, CircleSlash, XCircle } from "lucide-react";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { loadSeoAuditPageAction } from "@/app/(admin)/admin/application/seo-health/actions";
import { PRIORITY_LABELS, scoreTone } from "@/components/admin/seo/health/health-meta";
import { SideSheet } from "@/components/overlay/side-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import type { SeoAuditCheck, SeoAuditPageRow, SeoCheckCategory } from "@/lib/admin/seo-audit-types";
import { cn } from "@/lib/utils";

type Detail = SeoAuditPageRow & { checks: SeoAuditCheck[] };
type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; page: Detail };

function CheckRow({ check }: { check: SeoAuditCheck }) {
  const Icon = !check.counted ? CircleSlash : check.passed ? CheckCircle2 : XCircle;

  return (
    <li className="flex gap-3 p-3">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          !check.counted ? "text-muted-foreground" : check.passed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">{check.label}</p>
          {check.informational ? <Badge variant="outline">Informational</Badge> : null}
          {!check.counted ? <Badge variant="outline">Not scored</Badge> : null}
          {!check.passed && check.counted ? (
            <Badge variant="secondary">{PRIORITY_LABELS[check.priority]}</Badge>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{check.message}</p>
        {check.actual !== null || check.expected !== null ? (
          <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 text-xs">
            <dt className="text-muted-foreground">Found</dt>
            <dd className="break-all">{check.actual ?? "—"}</dd>
            <dt className="text-muted-foreground">Expected</dt>
            <dd className="break-all">{check.expected ?? "—"}</dd>
          </dl>
        ) : null}
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">×{check.weight}</span>
    </li>
  );
}

export function SeoAuditPageSheet({
  page,
  categories,
  onOpenChange,
}: {
  page: SeoAuditPageRow | null;
  categories: Record<SeoCheckCategory, string>;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const auditId = page?.audit_id;
  const pageId = page?.id;

  useEffect(() => {
    if (auditId === undefined || pageId === undefined) return;
    let active = true;
    void loadSeoAuditPageAction(auditId, pageId).then((result) => {
      if (!active) return;
      setState(result.ok ? { status: "ready", page: result.page } : { status: "error", message: result.message });
    });
    return () => {
      active = false;
    };
  }, [auditId, pageId]);

  const editHref = page?.seo_page_id ? `/admin/application/seo?page=${page.seo_page_id}` : null;

  return (
    <SideSheet
      open={page !== null}
      onOpenChange={onOpenChange}
      title={page?.label ?? "Page"}
      description={page?.url}
      footer={
        editHref ? (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={editHref as Route}>Edit this page&apos;s SEO</Link>
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5 p-4">
        {page ? (
          <div className="flex items-center gap-4 rounded-xl border border-border/70 p-4">
            <span className={cn("text-3xl font-semibold tabular-nums", scoreTone(page.score))}>
              {page.score === null ? "—" : `${page.score}%`}
            </span>
            <div className="text-xs leading-5 text-muted-foreground">
              <p>
                {page.passed} passed · {page.failed} failed
              </p>
              <p>
                HTTP {page.status_code ?? "—"}
                {page.ttfb_ms !== null ? ` · ${page.ttfb_ms} ms` : ""}
                {page.html_bytes !== null ? ` · ${Math.ceil(page.html_bytes / 1024)} KB` : ""}
              </p>
              {!page.indexable ? <p>Noindex page: configuration only, not scored.</p> : null}
            </div>
          </div>
        ) : null}

        {page?.error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{page.error}</p>
        ) : null}

        {state.status === "loading" ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : null}

        {state.status === "error" ? <p className="text-sm text-destructive">{state.message}</p> : null}

        {state.status === "ready"
          ? (Object.keys(categories) as SeoCheckCategory[]).map((category) => {
              const checks = state.page.checks.filter((check) => check.category === category);
              if (checks.length === 0) return null;
              const sorted = [...checks].sort((a, b) => Number(a.passed) - Number(b.passed));

              return (
                <section key={category} className="space-y-2">
                  <h4 className="text-sm font-semibold">{categories[category]}</h4>
                  <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
                    {sorted.map((check) => (
                      <CheckRow key={check.key} check={check} />
                    ))}
                  </ul>
                </section>
              );
            })
          : null}
      </div>
    </SideSheet>
  );
}
