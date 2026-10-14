"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";

import { loadSeoAuditPageAction } from "@/app/(admin)/admin/application/seo-health/actions";
import { CategoryRadar, categoryScoresFromChecks } from "@/components/admin/seo/health/charts/category-radar";
import { scoreTone } from "@/components/admin/seo/health/health-meta";
import { CheckList, checkRowId } from "@/components/admin/seo/health/seo-check-row";
import { SideSheet } from "@/components/overlay/side-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import type { SeoAuditCheck, SeoAuditPageRow, SeoCheckCategory } from "@/lib/admin/seo-audit-types";
import { cn } from "cn";

type Detail = SeoAuditPageRow & { checks: SeoAuditCheck[] };
type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; page: Detail };

type Filter = "all" | "failed" | "passed" | "not_scored";

/** Failed and Passed match the page's passed/failed counts, so they include not-scored checks too. */
const FILTERS: { value: Filter; label: string; empty: string; matches: (check: SeoAuditCheck) => boolean }[] = [
  { value: "all", label: "All", empty: "No checks ran on this page.", matches: () => true },
  { value: "failed", label: "Failed", empty: "Nothing failed on this page.", matches: (check) => !check.passed },
  { value: "passed", label: "Passed", empty: "No check passed on this page.", matches: (check) => check.passed },
  { value: "not_scored", label: "Not scored", empty: "Every check on this page is scored.", matches: (check) => !check.counted },
];

export function SeoAuditPageSheet({
  page,
  categories,
  highlight = null,
  onOpenChange,
}: {
  page: SeoAuditPageRow | null;
  categories: Record<SeoCheckCategory, string>;
  /** A check to scroll to and mark, when the sheet opens from a check filter. */
  highlight?: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");
  const auditId = page?.audit_id;
  const pageId = page?.id;
  const ready = state.status === "ready";

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

  useEffect(() => {
    if (!ready || !highlight) return;
    const frame = requestAnimationFrame(() => document.getElementById(checkRowId(highlight))?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [ready, highlight]);

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

        {state.status === "ready" ? (
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="gap-4">
            <TabsList className="sticky top-0 z-10 w-full">
              {FILTERS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                  <span className="tabular-nums text-muted-foreground">
                    {state.page.checks.filter(option.matches).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {FILTERS.map((option) => {
              const matching = state.page.checks.filter(option.matches);
              return (
                <TabsContent key={option.value} value={option.value} className="flex flex-col gap-5">
                  {matching.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                      {option.empty}
                    </p>
                  ) : (
                    (Object.keys(categories) as SeoCheckCategory[]).map((category) => {
                      const checks = matching.filter((check) => check.category === category);
                      if (checks.length === 0) return null;

                      return (
                        <section key={category} className="space-y-2">
                          <h4 className="flex items-center gap-2 text-sm font-semibold">
                            {categories[category]}
                            <span className="text-xs font-normal tabular-nums text-muted-foreground">{checks.length}</span>
                          </h4>
                          <CheckList checks={checks} highlight={highlight} />
                        </section>
                      );
                    })
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        ) : null}
      </div>
    </SideSheet>
  );
}
