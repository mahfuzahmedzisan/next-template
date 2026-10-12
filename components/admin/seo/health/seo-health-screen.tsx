"use client";

import { AlertTriangle, Gauge, Info, Loader2, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  loadSeoAuditHistoryAction,
  loadSeoAuditLatestAction,
  startSeoAuditAction,
} from "@/app/(admin)/admin/application/seo-health/actions";
import { ApplicationSectionHeader } from "@/components/admin/application/application-settings";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import {
  formatMinutes,
  PRIORITY_LABELS,
  scoreBar,
  scoreTone,
  typeLabel,
} from "@/components/admin/seo/health/health-meta";
import { SeoAuditPageSheet } from "@/components/admin/seo/health/seo-audit-page-sheet";
import { RobotsPanel, SitemapPanel, SitePanel } from "@/components/admin/seo/health/seo-health-sections";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  SeoAuditLatest,
  SeoAuditPageRow,
  SeoAuditRow,
  SeoAuditScope,
  SeoAuditSection,
} from "@/lib/admin/seo-audit-types";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";
import { cn } from "@/lib/utils";

const POLL_MS = 4000;
const POLL_LIMIT_MS = 20 * 60 * 1000;
const ALL_TYPES = "__all";

const SECTION_LABELS: Record<SeoAuditSection, string> = {
  pages: "Pages",
  site: "Site",
  sitemap: "Sitemap",
  robots: "robots.txt",
};

type Tab = "overview" | SeoAuditSection;

const RUNNING_LABELS: Record<SeoAuditScope, string> = {
  full: "Scanning the site…",
  sitemap: "Checking the sitemap…",
  robots: "Checking robots.txt…",
};

function isActive(audit: SeoAuditRow | null | undefined) {
  return audit?.status === "queued" || audit?.status === "running";
}

/** Polls while an audit runs: every 4 s, only while the tab is visible, for at most 20 minutes. */
function useAuditPolling(latest: SeoAuditLatest, onLatest: (latest: SeoAuditLatest) => void) {
  const running = isActive(latest.current);
  const runningId = running ? latest.current?.id : undefined;
  const onLatestRef = useRef(onLatest);
  useEffect(() => {
    onLatestRef.current = onLatest;
  });

  useEffect(() => {
    if (runningId === undefined) return;
    const startedAt = Date.now();

    const timer = window.setInterval(async () => {
      if (document.visibilityState === "hidden") return;
      if (Date.now() - startedAt > POLL_LIMIT_MS) {
        window.clearInterval(timer);
        toast.warning("The audit is taking a long time. Is the SEO queue worker running?");
        return;
      }
      const result = await loadSeoAuditLatestAction();
      if (result.ok) onLatestRef.current(result.latest);
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [runningId]);
}

function ScoreCard({
  latest,
  timeZone,
  onSection,
}: {
  latest: SeoAuditLatest;
  timeZone: string;
  onSection: (section: SeoAuditSection) => void;
}) {
  const completed = latest.completed;
  const score = completed?.score ?? null;
  const sections = completed?.summary?.sections ?? [];

  return (
    <section className="space-y-5 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
            <Gauge className="size-6 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Site score</p>
            <p className={cn("text-4xl font-semibold tabular-nums", scoreTone(score))}>{score === null ? "—" : `${score}%`}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 md:pl-6">
          <Progress value={score ?? 0} className={cn("h-2", scoreBar(score))} aria-label="Site score" />
          <p className="text-xs leading-5 text-muted-foreground">
            {completed
              ? `${completed.pages_total} page${completed.pages_total === 1 ? "" : "s"} · ${completed.checks_passed} checks passed · ${completed.checks_failed} failed · scanned ${formatDateTime(completed.finished_at, timeZone)}`
              : "No audit yet. Run one to scan every indexable page, the site settings, the sitemap and robots.txt."}
            {completed?.pages_failed ? ` · ${completed.pages_failed} page(s) could not be scanned` : ""}
          </p>
        </div>
      </div>

      {sections.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <li key={section.key}>
              <button
                type="button"
                onClick={() => onSection(section.key)}
                className="w-full space-y-2 rounded-xl border border-border/70 p-4 text-left outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>{section.label}</span>
                  <span className={cn("font-semibold tabular-nums", scoreTone(section.score))}>
                    {section.score === null ? "—" : `${section.score}%`}
                  </span>
                </div>
                <Progress value={section.score ?? 0} className={scoreBar(section.score)} aria-label={`${section.label} score`} />
                <p className="text-xs text-muted-foreground">{section.weight}% of the site score</p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Breakdown({ latest }: { latest: SeoAuditLatest }) {
  const summary = latest.completed?.summary;
  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-6">
        <h3 className="text-base font-semibold">By category</h3>
        <ul className="space-y-3">
          {summary.categories.map((category) => (
            <li key={category.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{category.label}</span>
                <span className={cn("font-medium tabular-nums", scoreTone(category.score))}>{category.score}%</span>
              </div>
              <Progress value={category.score} className={scoreBar(category.score)} aria-label={`${category.label} score`} />
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-6">
        <h3 className="text-base font-semibold">By page type</h3>
        {summary.types.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scored pages.</p>
        ) : (
          <ul className="space-y-3">
            {summary.types.map((type) => (
              <li key={type.type} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {type.label} <span className="text-muted-foreground">· {type.pages}</span>
                  </span>
                  <span className={cn("font-medium tabular-nums", scoreTone(type.score))}>{type.score}%</span>
                </div>
                <Progress value={type.score} className={scoreBar(type.score)} aria-label={`${type.label} score`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Issues({ latest }: { latest: SeoAuditLatest }) {
  const summary = latest.completed?.summary;
  if (!summary) return null;
  const development = latest.completed?.environment === "development";

  return (
    <section className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-6">
      <div>
        <h3 className="text-base font-semibold">Top issues</h3>
        <p className="mt-1 text-sm text-muted-foreground">Sorted by priority and weight. Fix the top ones first.</p>
      </div>
      {summary.issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to fix. Every scored check passed.</p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
          {summary.issues.map((issue) => (
            <li key={issue.key} className="flex flex-wrap items-start gap-3 p-4">
              <AlertTriangle
                className={cn("mt-0.5 size-4 shrink-0", issue.priority === "high" ? "text-destructive" : "text-amber-500")}
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{issue.label}</p>
                  <Badge variant={issue.priority === "high" ? "destructive" : "secondary"}>{PRIORITY_LABELS[issue.priority]}</Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{issue.message}</p>
              </div>
              <div className="text-right text-xs leading-5 text-muted-foreground">
                <p>
                  {(issue.section ?? "pages") === "pages"
                    ? `${issue.pages} page${issue.pages === 1 ? "" : "s"}`
                    : SECTION_LABELS[issue.section]}
                </p>
                <p>{formatMinutes(issue.fix_minutes * Math.max(1, issue.pages))} to fix</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {summary.informational.length > 0 ? (
        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <Info className="size-4 text-muted-foreground" aria-hidden />
            Informational
          </h4>
          <p className="text-xs leading-5 text-muted-foreground">
            Weight 1. Google doesn&apos;t rank on these; they help other tools and internal search.
          </p>
          <ul className="flex flex-wrap gap-2">
            {summary.informational.map((item) => (
              <li key={item.key}>
                <Badge variant="outline">
                  {item.label}: {item.passed} ok · {item.failed} missing
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.not_scored.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Not scored{development ? " on a development scan" : ""}</h4>
          <ul className="flex flex-wrap gap-2">
            {summary.not_scored.map((item) => (
              <li key={item.key}>
                <Badge variant="outline">
                  {item.label}: {item.failed > 0 ? `${item.failed} failing` : "ok"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function PagesTable({
  latest,
  onSelect,
}: {
  latest: SeoAuditLatest;
  onSelect: (page: SeoAuditPageRow) => void;
}) {
  const pages = useMemo(() => latest.completed?.pages ?? [], [latest.completed?.pages]);
  const [filter, setFilter] = useState(ALL_TYPES);
  const types = useMemo(
    () => Array.from(new Set(pages.map((page) => (page.kind === "page" ? "static" : page.page_type)))),
    [pages],
  );
  const visible = filter === ALL_TYPES ? pages : pages.filter((page) => (page.kind === "page" ? "static" : page.page_type) === filter);

  if (!latest.completed) return null;

  return (
    <section className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Pages</h3>
          <p className="mt-1 text-sm text-muted-foreground">Lowest scores first. Open a page to see every check.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seo-health-type" className="text-xs text-muted-foreground">
            Page type
          </Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger id="seo-health-type" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>All types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "static" ? "Static pages" : typeLabel("model", type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
        {visible.map((page) => (
          <li key={page.id}>
            <button
              type="button"
              onClick={() => onSelect(page)}
              className="flex w-full items-center gap-4 p-4 text-left outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{page.label}</p>
                  <Badge variant="secondary">{typeLabel(page.kind, page.page_type)}</Badge>
                  {!page.indexable ? <Badge variant="outline">noindex</Badge> : null}
                  {page.error ? <Badge variant="destructive">Not scanned</Badge> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">{page.url}</p>
              </div>
              <div className="hidden w-40 space-y-1 sm:block">
                <Progress value={page.score ?? 0} className={scoreBar(page.score)} aria-label={`${page.label} score`} />
                <p className="text-xs text-muted-foreground">
                  {page.passed} passed · {page.failed} failed
                </p>
              </div>
              <span className={cn("w-12 text-right text-sm font-semibold tabular-nums", scoreTone(page.score))}>
                {page.score === null ? "—" : `${page.score}%`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function History({ audits, timeZone }: { audits: SeoAuditRow[]; timeZone: string }) {
  const finished = audits.filter((audit) => audit.status !== "queued" && audit.status !== "running");
  if (finished.length === 0) return null;
  const chart = [...finished].reverse();

  return (
    <section className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-6">
      <h3 className="text-base font-semibold">History</h3>
      <div className="flex h-24 items-end gap-1.5" aria-hidden>
        {chart.map((audit) => (
          <div
            key={audit.id}
            title={`${audit.score ?? "—"}%`}
            className={cn(
              "min-w-2 flex-1 rounded-t",
              audit.status === "failed" ? "bg-destructive/40" : audit.environment === "development" ? "bg-muted-foreground/40" : "bg-primary/70",
            )}
            style={{ height: `${Math.max(4, audit.score ?? 0)}%` }}
          />
        ))}
      </div>
      <ul className="divide-y divide-border/70 rounded-xl border border-border/70 text-sm">
        {finished.map((audit) => (
          <li key={audit.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
            <span className={cn("w-12 font-semibold tabular-nums", scoreTone(audit.score))}>
              {audit.score === null ? "—" : `${audit.score}%`}
            </span>
            <span className="flex-1 text-muted-foreground">{formatDateTime(audit.finished_at ?? audit.created_at, timeZone)}</span>
            {(audit.scope ?? "full") === "full" ? (
              <span className="text-xs text-muted-foreground">
                {audit.pages_total} page{audit.pages_total === 1 ? "" : "s"}
              </span>
            ) : (
              <Badge variant="outline">{audit.scope === "sitemap" ? "Sitemap only" : "robots.txt only"}</Badge>
            )}
            {audit.environment === "development" ? <Badge variant="outline">Development</Badge> : null}
            {audit.trigger === "schedule" ? <Badge variant="outline">Scheduled</Badge> : null}
            {audit.status === "failed" ? <Badge variant="destructive">Failed</Badge> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SeoHealthScreen({
  initialLatest,
  initialHistory,
}: {
  initialLatest: SeoAuditLatest;
  initialHistory: SeoAuditRow[];
}) {
  const [latest, setLatest] = useState(initialLatest);
  const [history, setHistory] = useState(initialHistory);
  const [includeNoindex, setIncludeNoindex] = useState(false);
  const [selected, setSelected] = useState<SeoAuditPageRow | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [pendingScope, setPendingScope] = useState<SeoAuditScope | null>(null);
  const [pending, startTransition] = useTransition();
  const timeZone = useDisplayTimeZone();
  const current = latest.current;
  const running = isActive(current);

  function applyLatest(next: SeoAuditLatest) {
    const wasRunning = isActive(latest.current);
    setLatest(next);

    if (wasRunning && !isActive(next.current)) {
      if (next.current?.status === "failed") {
        toast.error(next.current.error || "The audit failed.");
      } else {
        toast.success("Audit finished.");
      }
      void loadSeoAuditHistoryAction().then((result) => {
        if (result.ok) setHistory(result.audits);
      });
    }
  }

  useAuditPolling(latest, applyLatest);

  function run(scope: SeoAuditScope = "full") {
    setPendingScope(scope);
    startTransition(async () => {
      const result = await startSeoAuditAction(includeNoindex, scope);
      setPendingScope(null);
      if (result.latest) setLatest(result.latest);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(scope === "full" ? "Audit started. Results appear here when it finishes." : "Scan started.");
    });
  }

  const busy = running || pending;
  const runningScope = running ? (current?.scope ?? "full") : pendingScope;
  const progress = current && current.pages_total > 0 ? Math.round((current.pages_scanned / current.pages_total) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ApplicationSectionHeader section="seo-health">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="seo-include-noindex" checked={includeNoindex} onCheckedChange={setIncludeNoindex} disabled={busy} />
            <Label htmlFor="seo-include-noindex" className="text-sm">
              Include noindex pages
            </Label>
          </div>
          <Button type="button" onClick={() => run("full")} disabled={busy}>
            {busy && runningScope === "full" ? (
              <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
            ) : (
              <Play data-icon="inline-start" aria-hidden />
            )}
            {running && runningScope === "full" ? "Scanning…" : "Run full audit"}
          </Button>
        </div>
      </ApplicationSectionHeader>

      {running && current ? (
        <Alert>
          <Loader2 className="animate-spin" aria-hidden />
          <AlertTitle>{current.status === "queued" ? "Waiting for the SEO worker…" : RUNNING_LABELS[current.scope ?? "full"]}</AlertTitle>
          <AlertDescription>
            <div className="w-full space-y-2">
              <p>
                {current.pages_total > 0
                  ? `${current.pages_scanned} of ${current.pages_total} pages scanned.`
                  : (current.scope ?? "full") === "full"
                    ? "Checking the site, robots.txt and the sitemap."
                    : "This takes a few seconds."}{" "}
                You can leave this page; the scan keeps running.
              </p>
              {current.pages_total > 0 ? <Progress value={progress} aria-label="Audit progress" /> : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {current?.status === "failed" ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>The last audit failed</AlertTitle>
          <AlertDescription>{current.error || "The audit job stopped."}</AlertDescription>
        </Alert>
      ) : null}

      {latest.completed?.environment === "development" ? (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Development scan</AlertTitle>
          <AlertDescription>
            Performance and HTTPS results are not representative. Run against the production URL or{" "}
            <code>next build &amp;&amp; next start</code> for real numbers.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="site">Site</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="robots">robots.txt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <ScoreCard latest={latest} timeZone={timeZone} onSection={setTab} />
          <Breakdown latest={latest} />
          <Issues latest={latest} />
          <History audits={history} timeZone={timeZone} />
        </TabsContent>

        <TabsContent value="pages">
          {latest.completed ? (
            <PagesTable latest={latest} onSelect={setSelected} />
          ) : (
            <p className="text-sm text-muted-foreground">Run a full audit to scan every page.</p>
          )}
        </TabsContent>

        <TabsContent value="site">
          <SitePanel report={latest.sections?.site} timeZone={timeZone} />
        </TabsContent>

        <TabsContent value="sitemap">
          <SitemapPanel
            report={latest.sections?.sitemap}
            timeZone={timeZone}
            onRescan={() => run("sitemap")}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="robots">
          <RobotsPanel report={latest.sections?.robots} timeZone={timeZone} onRescan={() => run("robots")} busy={busy} />
        </TabsContent>
      </Tabs>

      {selected ? (
        <SeoAuditPageSheet
          key={selected.id}
          page={selected}
          categories={latest.categories}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}
