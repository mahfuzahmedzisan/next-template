"use client";

import { AlertTriangle, ChevronRight, Info, Loader2, Play, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  loadSeoAuditHistoryAction,
  loadSeoAuditLatestAction,
  startSeoAuditAction,
} from "@/app/(admin)/admin/application/seo-health/actions";
import { ApplicationSectionHeader } from "@/components/admin/application/application-settings";
import { ChartEmpty, ChartPanel } from "@/components/admin/charts/chart-panel";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import { CategoryRadar } from "@/components/admin/seo/health/charts/category-radar";
import { ChecksDonut } from "@/components/admin/seo/health/charts/checks-donut";
import { HistoryChart } from "@/components/admin/seo/health/charts/history-chart";
import { PageCharts } from "@/components/admin/seo/health/charts/page-charts";
import { ScoreGauge } from "@/components/admin/seo/health/charts/score-gauge";
import { ScoreBars } from "@/components/admin/seo/health/charts/score-bars";
import {
  formatMinutes,
  PRIORITY_LABELS,
  scoreBar,
  scoreFill,
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
  SeoAuditSummary,
  SeoCheckCategory,
  SeoCheckPriority,
} from "@/lib/admin/seo-audit-types";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";
import { cn } from "cn";

const POLL_MS = 4000;
const POLL_LIMIT_MS = 20 * 60 * 1000;
const ALL_TYPES = "__all";
/** Matches config/seo.php, for an API that predates `limits`. */
const DEFAULT_LIMITS = { ttfb_ms: 800, max_html_kb: 512 };

const SECTION_LABELS: Record<SeoAuditSection, string> = {
  pages: "Pages",
  site: "Site",
  sitemap: "Sitemap",
  robots: "robots.txt",
};

type Tab = "overview" | SeoAuditSection;

const TABS: Tab[] = ["overview", "pages", "site", "sitemap", "robots"];

function parseTab(value: string | null): Tab {
  return TABS.includes(value as Tab) ? (value as Tab) : "overview";
}

const TABS_ID = "seo-health-tabs";
const ISSUES_ID = "seo-health-issues";

type Go = (tab: Tab, options?: { check?: string; scrollTo?: string }) => void;

/** The open tab and the focused check live in `?tab=` and `?check=`, so links, reloads and back/forward keep them. */
function useView(): { tab: Tab; check: string | null; go: Go } {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const check = tab === "overview" ? null : searchParams.get("check");

  const go: Go = (next, options = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    if (options.check) params.set("check", options.check);
    else params.delete("check");
    const query = params.toString();
    window.history.pushState(null, "", query ? `?${query}` : window.location.pathname);

    const target = options.scrollTo;
    if (target) {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior, block: "start" }));
    }
  };

  return { tab, check, go };
}

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

    let inFlight = false;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (document.visibilityState === "hidden" || inFlight) return;
      if (Date.now() - startedAt > POLL_LIMIT_MS) {
        window.clearInterval(timer);
        toast.warning("The audit is taking a long time. Is the SEO queue worker running?");
        return;
      }
      inFlight = true;
      const result = await loadSeoAuditLatestAction().finally(() => {
        inFlight = false;
      });
      if (!cancelled && result.ok) onLatestRef.current(result.latest);
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [runningId]);
}

function ScoreCard({
  latest,
  timeZone,
  onSection,
  onChecks,
}: {
  latest: SeoAuditLatest;
  timeZone: string;
  onSection: (section: SeoAuditSection) => void;
  onChecks: (result: "passed" | "failed") => void;
}) {
  const completed = latest.completed;
  const score = completed?.score ?? null;
  const sections = completed?.summary?.sections ?? [];

  return (
    <section className="space-y-5 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
        <ScoreGauge score={score} label="Site score" className="mx-auto" />
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-base font-semibold">Site score</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {completed
              ? `${completed.pages_total} page${completed.pages_total === 1 ? "" : "s"} · ${completed.checks_passed} checks passed · ${completed.checks_failed} failed · scanned ${formatDateTime(completed.finished_at, timeZone)}`
              : "No audit yet. Run one to scan every indexable page, the site settings, the sitemap and robots.txt."}
            {completed?.pages_failed ? ` · ${completed.pages_failed} page(s) could not be scanned` : ""}
          </p>
        </div>
        {completed ? (
          <ChecksDonut
            passed={completed.checks_passed}
            failed={completed.checks_failed}
            onSelect={onChecks}
            className="w-44"
          />
        ) : null}
      </div>

      {sections.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <li key={section.key}>
              <button
                type="button"
                onClick={() => onSection(section.key)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/70 p-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ScoreGauge score={section.score} label={`${section.label} score`} size="sm" />
                <span className="min-w-0 space-y-0.5">
                  <span className="block text-sm font-medium">{section.label}</span>
                  <span className="block text-xs text-muted-foreground">{section.weight}% of the site score</span>
                </span>
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

  const pages = summary.types.reduce((total, type) => total + type.pages, 0);
  const lowest = summary.types.reduce<(typeof summary.types)[number] | null>(
    (min, type) => (min === null || type.score < min.score ? type : min),
    null,
  );
  const stats = [
    { label: "Page types", value: summary.types.length.toString() },
    { label: "Pages scored", value: pages.toString() },
    { label: "Lowest", value: lowest ? `${lowest.score}%` : "—", hint: lowest?.label },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartPanel title="By category" description="Weighted share of checks passed in each category.">
        <div className="flex flex-1 items-center">
          <CategoryRadar categories={summary.categories} className="aspect-auto h-56 max-w-none" />
        </div>
        <ul className="flex flex-wrap justify-center gap-2">
          {summary.categories.map((category) => (
            <li key={category.key}>
              <Badge variant="outline" className="gap-1.5">
                <span className="size-2 rounded-full" style={{ background: scoreFill(category.score) }} aria-hidden />
                {category.label}
                <span className="tabular-nums text-muted-foreground">{category.score}%</span>
              </Badge>
            </li>
          ))}
        </ul>
      </ChartPanel>
      <ChartPanel title="By page type" description="Average score of each page type.">
        <div className="flex flex-1 flex-col justify-center">
          {summary.types.length === 0 ? (
            <ChartEmpty>No scored pages.</ChartEmpty>
          ) : (
            <ScoreBars
              rows={summary.types.map((type) => ({
                key: type.type,
                label: type.label,
                value: type.score,
                hint: `${type.pages} page${type.pages === 1 ? "" : "s"}`,
              }))}
              valueLabel="Score"
              max={100}
            />
          )}
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 rounded-lg border border-border/70 p-3">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</dd>
              {stat.hint ? <dd className="truncate text-xs text-muted-foreground">{stat.hint}</dd> : null}
            </div>
          ))}
        </dl>
      </ChartPanel>
    </div>
  );
}

const PRIORITY_COLORS: Record<SeoCheckPriority, string> = {
  high: "var(--score-bad)",
  medium: "var(--score-warn)",
  low: "var(--muted-foreground)",
};

/** Issue count by priority and estimated fix time by category, from the stored summary. */
function IssueReport({
  summary,
  categories,
  priority,
  onPriority,
}: {
  summary: SeoAuditSummary;
  categories: Record<SeoCheckCategory, string>;
  priority: SeoCheckPriority | null;
  onPriority: (priority: SeoCheckPriority) => void;
}) {
  if (summary.issues.length === 0) return null;

  const slices = (Object.keys(PRIORITY_LABELS) as SeoCheckPriority[]).map((priority) => ({
    key: priority,
    label: PRIORITY_LABELS[priority],
    value: summary.issues.filter((issue) => issue.priority === priority).length,
    color: PRIORITY_COLORS[priority],
  }));

  const minutes = new Map<SeoCheckCategory, number>();
  for (const issue of summary.issues) {
    minutes.set(issue.category, (minutes.get(issue.category) ?? 0) + issue.fix_minutes * Math.max(1, issue.pages));
  }
  const fixRows = [...minutes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => ({ key: category, label: categories[category] ?? category, value, fill: "var(--chart-1)" }));

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-2 rounded-xl border border-border/70 p-4">
        <h4 className="text-sm font-semibold">Issues by priority</h4>
        <DonutChart
          slices={slices}
          caption={summary.issues.length === 1 ? "issue" : "issues"}
          onSelect={(key) => onPriority(key as SeoCheckPriority)}
          selected={priority}
          className="max-w-52"
        />
      </div>
      <div className="space-y-2 rounded-xl border border-border/70 p-4">
        <h4 className="text-sm font-semibold">Estimated fix time by category</h4>
        <ScoreBars rows={fixRows} valueLabel="Fix time" format={formatMinutes} />
      </div>
    </div>
  );
}

function CheckBadge({ onOpen, children }: { onOpen?: () => void; children: ReactNode }) {
  if (!onOpen) return <Badge variant="outline">{children}</Badge>;

  return (
    <Badge asChild variant="outline" className="cursor-pointer hover:bg-muted">
      <button type="button" onClick={onOpen}>
        {children}
        <ChevronRight data-icon="inline-end" aria-hidden />
      </button>
    </Badge>
  );
}

function Issues({
  latest,
  onOpen,
}: {
  latest: SeoAuditLatest;
  onOpen: (key: string, section?: SeoAuditSection) => void;
}) {
  const [priority, setPriority] = useState<SeoCheckPriority | null>(null);
  const summary = latest.completed?.summary;
  if (!summary) return null;
  const development = latest.completed?.environment === "development";
  const issues = priority ? summary.issues.filter((issue) => issue.priority === priority) : summary.issues;

  return (
    <section id={ISSUES_ID} className="scroll-mt-20 space-y-4 rounded-xl border border-border/70 bg-card/70 p-6">
      <div>
        <h3 className="text-base font-semibold">Top issues</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sorted by priority and weight. Open an issue to see where it fails.
        </p>
      </div>
      <IssueReport
        summary={summary}
        categories={latest.categories}
        priority={priority}
        onPriority={(next) => setPriority((current) => (current === next ? null : next))}
      />
      {priority ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {issues.length} {PRIORITY_LABELS[priority].toLowerCase()} priority issue{issues.length === 1 ? "" : "s"}.
          </span>
          <Button type="button" variant="ghost" size="xs" onClick={() => setPriority(null)}>
            <X data-icon="inline-start" aria-hidden />
            Show all
          </Button>
        </div>
      ) : null}
      {summary.issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to fix. Every scored check passed.</p>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
          {issues.map((issue) => {
            const section = issue.section ?? "pages";
            return (
              <li key={issue.key}>
                <button
                  type="button"
                  onClick={() => onOpen(issue.key, section)}
                  className="group flex w-full flex-wrap items-start gap-3 p-4 text-left outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <AlertTriangle
                    className={cn("mt-0.5 size-4 shrink-0", issue.priority === "high" ? "text-destructive" : "text-amber-500")}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{issue.label}</p>
                      <Badge variant={issue.priority === "high" ? "destructive" : "secondary"}>
                        {PRIORITY_LABELS[issue.priority]}
                      </Badge>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">{issue.message}</p>
                  </div>
                  <div className="text-right text-xs leading-5 text-muted-foreground">
                    <p>{section === "pages" ? `${issue.pages} page${issue.pages === 1 ? "" : "s"}` : SECTION_LABELS[section]}</p>
                    <p>{formatMinutes(issue.fix_minutes * Math.max(1, issue.pages))} to fix</p>
                  </div>
                  <ChevronRight
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
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
                <CheckBadge onOpen={item.failed > 0 ? () => onOpen(item.key) : undefined}>
                  {item.label}: {item.passed} ok · {item.failed} missing
                </CheckBadge>
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
                <CheckBadge onOpen={item.failed > 0 ? () => onOpen(item.key) : undefined}>
                  {item.label}: {item.failed > 0 ? `${item.failed} failing` : "ok"}
                </CheckBadge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function checkLabel(summary: SeoAuditSummary | null | undefined, key: string) {
  return (
    summary?.issues.find((issue) => issue.key === key)?.label ??
    summary?.informational.find((item) => item.key === key)?.label ??
    summary?.not_scored.find((item) => item.key === key)?.label ??
    key
  );
}

function PagesTable({
  latest,
  check,
  onClearCheck,
  onSelect,
}: {
  latest: SeoAuditLatest;
  check: string | null;
  onClearCheck: () => void;
  onSelect: (page: SeoAuditPageRow) => void;
}) {
  const pages = useMemo(() => latest.completed?.pages ?? [], [latest.completed?.pages]);
  const [filter, setFilter] = useState(ALL_TYPES);
  const types = useMemo(
    () => Array.from(new Set(pages.map((page) => (page.kind === "page" ? "static" : page.page_type)))),
    [pages],
  );
  const visible = pages.filter(
    (page) =>
      (filter === ALL_TYPES || (page.kind === "page" ? "static" : page.page_type) === filter) &&
      (check === null || (page.failed_checks?.includes(check) ?? true)),
  );

  if (!latest.completed) return null;

  return (
    <div className="flex flex-col gap-4">
      {check ? (
        <Alert>
          <AlertTriangle aria-hidden />
          <AlertTitle>Pages failing “{checkLabel(latest.completed.summary, check)}”</AlertTitle>
          <AlertDescription>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <span>
                {visible.length} of {pages.length} page{pages.length === 1 ? "" : "s"}. Open a page to see the check and how to fix it.
              </span>
              <Button type="button" variant="outline" size="xs" onClick={onClearCheck}>
                <X data-icon="inline-start" aria-hidden />
                Show all pages
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
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

      <div className={cn(check && "order-last")}>
        <PageCharts pages={visible} limits={latest.limits ?? DEFAULT_LIMITS} />
      </div>

      <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card/70">
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
    </div>
  );
}

function History({ audits, timeZone }: { audits: SeoAuditRow[]; timeZone: string }) {
  const finished = audits.filter((audit) => audit.status !== "queued" && audit.status !== "running");
  if (finished.length === 0) return null;

  return (
    <ChartPanel title="History" description="Score of each audit over time, newest on the right.">
      <HistoryChart audits={finished} timeZone={timeZone} />
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
    </ChartPanel>
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
  const { tab, check, go } = useView();
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

  /** Page checks open the Pages tab filtered to the failing pages; site-wide checks open their section with the check marked. */
  function openCheck(key: string, section?: SeoAuditSection) {
    const pages = latest.completed?.pages ?? [];
    const tracked = pages.some((page) => page.failed_checks !== undefined);
    const target = section ?? (!tracked || pages.some((page) => page.failed_checks?.includes(key)) ? "pages" : "site");
    go(target, { check: key, scrollTo: target === "pages" ? TABS_ID : undefined });
  }

  function openChecks(result: "passed" | "failed") {
    if (result === "failed") go("overview", { scrollTo: ISSUES_ID });
    else go("pages", { scrollTo: TABS_ID });
  }

  const busy = running || pending;
  const runningScope = running ? (current?.scope ?? "full") : pendingScope;
  const progress = current && current.pages_total > 0 ? Math.round((current.pages_scanned / current.pages_total) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
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

      <Tabs id={TABS_ID} value={tab} onValueChange={(value) => go(value as Tab)} className="scroll-mt-20 gap-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="site">Site</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="robots">robots.txt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <ScoreCard
            latest={latest}
            timeZone={timeZone}
            onSection={(section) => go(section, { scrollTo: TABS_ID })}
            onChecks={openChecks}
          />
          <Breakdown latest={latest} />
          <Issues latest={latest} onOpen={openCheck} />
          <History audits={history} timeZone={timeZone} />
        </TabsContent>

        <TabsContent value="pages">
          {latest.completed ? (
            <PagesTable
              latest={latest}
              check={check}
              onClearCheck={() => go("pages")}
              onSelect={setSelected}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Run a full audit to scan every page.</p>
          )}
        </TabsContent>

        <TabsContent value="site">
          <SitePanel report={latest.sections?.site} timeZone={timeZone} highlight={check} />
        </TabsContent>

        <TabsContent value="sitemap">
          <SitemapPanel
            report={latest.sections?.sitemap}
            timeZone={timeZone}
            onRescan={() => run("sitemap")}
            busy={busy}
            highlight={check}
          />
        </TabsContent>

        <TabsContent value="robots">
          <RobotsPanel
            report={latest.sections?.robots}
            timeZone={timeZone}
            onRescan={() => run("robots")}
            busy={busy}
            highlight={check}
          />
        </TabsContent>
      </Tabs>

      {selected ? (
        <SeoAuditPageSheet
          key={selected.id}
          page={selected}
          categories={latest.categories}
          highlight={tab === "pages" ? check : null}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}
