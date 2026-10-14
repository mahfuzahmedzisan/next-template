"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect } from "react";

import { formatDateTime } from "@/components/admin/devices/device-meta";
import { ScoreBars } from "@/components/admin/seo/health/charts/score-bars";
import { scoreBar, scoreTone } from "@/components/admin/seo/health/health-meta";
import { CheckList, checkRowId } from "@/components/admin/seo/health/seo-check-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
  SeoRobotsDetails,
  SeoSectionReport,
  SeoSiteDetails,
  SeoSitemapDetails,
} from "@/lib/admin/seo-audit-types";
import { cn } from "cn";

function SectionShell<Details>({
  title,
  description,
  report,
  timeZone,
  rescan,
  highlight = null,
  children,
}: {
  title: string;
  description: string;
  report: SeoSectionReport<Details> | null | undefined;
  timeZone: string;
  rescan?: { label: string; onClick: () => void; busy: boolean };
  highlight?: string | null;
  children?: ReactNode;
}) {
  const hasReport = Boolean(report);

  useEffect(() => {
    if (!hasReport || !highlight) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const frame = requestAnimationFrame(() =>
      document.getElementById(checkRowId(highlight))?.scrollIntoView({ behavior, block: "center" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [hasReport, highlight]);

  return (
    <section className="space-y-5 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {rescan ? (
          <Button type="button" variant="outline" size="sm" onClick={rescan.onClick} disabled={rescan.busy}>
            {rescan.busy ? (
              <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
            ) : (
              <RefreshCw data-icon="inline-start" aria-hidden />
            )}
            {rescan.label}
          </Button>
        ) : null}
      </div>

      {report ? (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 p-4">
            <span className={cn("text-3xl font-semibold tabular-nums", scoreTone(report.score))}>
              {report.score === null ? "—" : `${report.score}%`}
            </span>
            <div className="min-w-48 flex-1 space-y-1.5">
              <Progress value={report.score ?? 0} className={scoreBar(report.score)} aria-label={`${title} score`} />
              <p className="text-xs text-muted-foreground">
                {report.passed} passed · {report.failed} failed · scanned {formatDateTime(report.finished_at, timeZone)}
                {report.scope !== "full" ? ` · ${report.scope} run` : ""}
              </p>
            </div>
            {report.environment === "development" ? <Badge variant="outline">Development</Badge> : null}
          </div>
          <CheckList checks={report.checks} highlight={highlight} />
          {children}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Not scanned yet. Run an audit to check this section.</p>
      )}
    </section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{label}</h4>
      {children}
    </div>
  );
}

function sitemapName(url: string) {
  try {
    return new URL(url).pathname.replace(/^\/+/, "") || url;
  } catch {
    return url;
  }
}

function UrlList({ urls }: { urls: string[] }) {
  return (
    <ul className="divide-y divide-border/70 rounded-xl border border-border/70 text-xs">
      {urls.map((url) => (
        <li key={url} className="truncate px-3 py-2 font-mono">
          {url}
        </li>
      ))}
    </ul>
  );
}

export function SitePanel({
  report,
  timeZone,
  highlight,
}: {
  report: SeoSectionReport<SeoSiteDetails> | null | undefined;
  timeZone: string;
  highlight?: string | null;
}) {
  return (
    <SectionShell
      title="Site"
      description="Checked once per audit: favicon and icons, index-file redirects, real 404s, trailing slashes, HTTPS and a single host."
      report={report}
      timeZone={timeZone}
      highlight={highlight}
    >
      {report && report.details.icons.length > 0 ? (
        <Detail label="Icons declared on the home page">
          <UrlList urls={report.details.icons} />
        </Detail>
      ) : null}
    </SectionShell>
  );
}

export function SitemapPanel({
  report,
  timeZone,
  onRescan,
  busy,
  highlight,
}: {
  report: SeoSectionReport<SeoSitemapDetails> | null | undefined;
  timeZone: string;
  onRescan: () => void;
  busy: boolean;
  highlight?: string | null;
}) {
  const details = report?.details;

  return (
    <SectionShell
      title="Sitemap"
      description="Every sitemap from robots.txt (or /sitemap.xml) is read like a search engine: XML and limits, each URL fetched, and every indexable page must be listed."
      report={report}
      timeZone={timeZone}
      rescan={{ label: "Re-scan sitemap", onClick: onRescan, busy }}
      highlight={highlight}
    >
      {details ? (
        <>
          {details.files.length > 0 ? (
            <Detail label="URLs per sitemap file">
              <ScoreBars
                rows={details.files.map((file) => ({
                  key: file.url,
                  label: sitemapName(file.url),
                  hint: file.url,
                  value: file.count,
                  fill: file.error || file.status !== 200 ? "var(--score-bad)" : "var(--chart-2)",
                }))}
                valueLabel="Entries"
                format={(value) => value.toLocaleString()}
              />
            </Detail>
          ) : null}
          <Detail label={`Files · ${details.urls} URL${details.urls === 1 ? "" : "s"}`}>
            <ul className="divide-y divide-border/70 rounded-xl border border-border/70 text-xs">
              {details.files.map((file) => (
                <li key={file.url} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-mono">{file.url}</span>
                  <Badge variant={file.status === 200 && !file.error ? "secondary" : "destructive"}>{file.status ?? "—"}</Badge>
                  {file.root ? <Badge variant="outline">{file.root}</Badge> : null}
                  {file.gzip ? <Badge variant="outline">gzip</Badge> : null}
                  <span className="text-muted-foreground">
                    {file.count} entr{file.count === 1 ? "y" : "ies"}
                    {file.bytes !== null ? ` · ${Math.ceil(file.bytes / 1024)} KB` : ""}
                  </span>
                  {file.error ? <span className="w-full text-destructive">{file.error}</span> : null}
                </li>
              ))}
            </ul>
          </Detail>
          {details.missing.length > 0 ? (
            <Detail label="Indexable pages missing from the sitemap">
              <UrlList urls={details.missing} />
            </Detail>
          ) : null}
          {details.sample.length > 0 ? (
            <Detail label={details.urls > details.sample.length ? `First ${details.sample.length} URLs` : "URLs"}>
              <UrlList urls={details.sample} />
            </Detail>
          ) : null}
        </>
      ) : null}
    </SectionShell>
  );
}

export function RobotsPanel({
  report,
  timeZone,
  onRescan,
  busy,
  highlight,
}: {
  report: SeoSectionReport<SeoRobotsDetails> | null | undefined;
  timeZone: string;
  onRescan: () => void;
  busy: boolean;
  highlight?: string | null;
}) {
  const details = report?.details;
  const blocked = details?.ai.blocked ?? [];
  const allowed = details?.ai.allowed ?? [];

  return (
    <SectionShell
      title="robots.txt"
      description="Parsed per RFC 9309 and matched like Google: syntax, the rules for every crawler, assets and pages that must stay crawlable, and the declared sitemaps."
      report={report}
      timeZone={timeZone}
      rescan={{ label: "Re-scan robots.txt", onClick: onRescan, busy }}
      highlight={highlight}
    >
      {details ? (
        <>
          {details.groups.length > 0 ? (
            <Detail label="Groups">
              <ul className="flex flex-wrap gap-2">
                {details.groups.map((group, index) => (
                  <li key={index}>
                    <Badge variant="outline">
                      {group.agents.join(", ")} · {group.rules} rule{group.rules === 1 ? "" : "s"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Detail>
          ) : null}
          {blocked.length + allowed.length > 0 ? (
            <Detail label="AI crawlers">
              <p className="text-xs leading-5 text-muted-foreground">
                {blocked.length > 0 ? `Blocked: ${blocked.join(", ")}. ` : ""}
                {allowed.length > 0 ? `Allowed: ${allowed.join(", ")}.` : ""}
              </p>
            </Detail>
          ) : null}
          {details.content ? (
            <Detail label={details.url}>
              <pre className="max-h-80 overflow-auto rounded-xl border border-border/70 bg-muted/40 p-3 font-mono text-xs leading-5">
                {details.content}
              </pre>
            </Detail>
          ) : null}
        </>
      ) : null}
    </SectionShell>
  );
}
