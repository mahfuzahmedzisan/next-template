"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";

import { loadSeoAuditPageAction } from "@/app/(admin)/admin/application/seo-health/actions";
import { CategoryRadar, categoryScoresFromChecks } from "@/components/admin/seo/health/charts/category-radar";
import { scoreTone } from "@/components/admin/seo/health/health-meta";
import { CheckList } from "@/components/admin/seo/health/seo-check-row";
import { SideSheet } from "@/components/overlay/side-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import type { SeoAuditCheck, SeoAuditPageRow, SeoCheckCategory } from "@/lib/admin/seo-audit-types";
import { cn } from "@/lib/utils";

type Detail = SeoAuditPageRow & { checks: SeoAuditCheck[] };
type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; page: Detail };

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

        {state.status === "ready" && page?.indexable ? (
          <section className="space-y-2 rounded-xl border border-border/70 p-4">
            <h4 className="text-sm font-semibold">Score by category</h4>
            <CategoryRadar categories={categoryScoresFromChecks(state.page.checks, categories)} className="max-w-64" />
          </section>
        ) : null}

        {state.status === "ready"
          ? (Object.keys(categories) as SeoCheckCategory[]).map((category) => {
              const checks = state.page.checks.filter((check) => check.category === category);
              if (checks.length === 0) return null;

              return (
                <section key={category} className="space-y-2">
                  <h4 className="text-sm font-semibold">{categories[category]}</h4>
                  <CheckList checks={checks} />
                </section>
              );
            })
          : null}
      </div>
    </SideSheet>
  );
}
