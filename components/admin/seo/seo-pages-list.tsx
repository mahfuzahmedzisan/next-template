"use client";

import { ExternalLink, FileText, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteSeoPageAction,
  loadSeoOverviewAction,
  probeSeoPageAction,
} from "@/app/(admin)/admin/application/seo/actions";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import { needsAttention, PAGE_TYPE_LABELS, statusInfo, type StatusTone } from "@/components/admin/seo/seo-meta";
import { SeoPageEditor } from "@/components/admin/seo/seo-page-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SeoOverview, SeoPageEntry } from "@/lib/admin/seo-types";
import { cn } from "cn";

const POLL_MS = 4000;
const POLL_LIMIT_MS = 2 * 60 * 1000;

const TONE: Record<StatusTone, string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  bad: "border-destructive/30 bg-destructive/10 text-destructive",
  idle: "",
};

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

type Filter = "all" | "attention" | "hidden";

const FILTERS: { value: Filter; label: string; match: (page: SeoPageEntry) => boolean }[] = [
  { value: "all", label: "All", match: () => true },
  { value: "attention", label: "Needs attention", match: needsAttention },
  { value: "hidden", label: "Hidden from search", match: (page) => !page.resolved.robots.index || !page.resolved.in_sitemap },
];

function matchesQuery(page: SeoPageEntry, query: string) {
  if (!query) return true;
  return [page.label, page.path, page.resolved.title].some((value) => value.toLowerCase().includes(query));
}

type Watch = { since: string | null; startedAt: number };

/** Re-check: poll until the probe stores a new result, for at most two minutes, only while the tab is visible. */
function useRecheckWatch(onOverview: (overview: SeoOverview) => void) {
  const [watching, setWatching] = useState<Record<number, Watch>>({});
  const watchingRef = useRef(watching);
  const onOverviewRef = useRef(onOverview);
  useEffect(() => {
    watchingRef.current = watching;
    onOverviewRef.current = onOverview;
  });

  const active = Object.keys(watching).length > 0;

  useEffect(() => {
    if (!active) return;

    let inFlight = false;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (document.hidden || inFlight) return;
      inFlight = true;
      const result = await loadSeoOverviewAction().finally(() => {
        inFlight = false;
      });
      if (cancelled || !result.ok) return;
      onOverviewRef.current(result.overview);

      const next: Record<number, Watch> = {};
      for (const [key, watch] of Object.entries(watchingRef.current)) {
        const page = result.overview.pages.find((entry) => entry.id === Number(key));
        if (!page || page.status.checked_at !== watch.since) continue;
        if (Date.now() - watch.startedAt > POLL_LIMIT_MS) {
          toast.warning(`${page.path} is still waiting for a check. Is the SEO queue worker running?`);
          continue;
        }
        next[Number(key)] = watch;
      }
      setWatching(next);
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active]);

  return {
    isWatching: (id: number) => id in watching,
    watch: (page: SeoPageEntry) =>
      setWatching((current) => ({ ...current, [page.id]: { since: page.status.checked_at, startedAt: Date.now() } })),
  };
}

export function SeoPagesList({
  overview,
  timeZone,
  openPageId,
  onOverview,
  onPage,
}: {
  overview: SeoOverview;
  timeZone: string;
  /** Opens this page's editor on first render (links from SEO health). */
  openPageId: number | null;
  onOverview: (overview: SeoOverview) => void;
  onPage: (page: SeoPageEntry) => void;
}) {
  const [editing, setEditing] = useState<{ page: SeoPageEntry | null; key: number } | null>(() => {
    const page = overview.pages.find((entry) => entry.id === openPageId);
    return page ? { page, key: page.id } : null;
  });

  useEffect(() => {
    if (openPageId === null) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("page");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [openPageId]);
  const [removing, setRemoving] = useState<SeoPageEntry | null>(null);
  const [pending, startTransition] = useTransition();
  const recheck = useRecheckWatch(onOverview);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const needle = useDeferredValue(query.trim().toLowerCase());
  const activeFilter = FILTERS.find((entry) => entry.value === filter) ?? FILTERS[0];
  const visible = overview.pages.filter((page) => activeFilter.match(page) && matchesQuery(page, needle));

  function probe(page: SeoPageEntry) {
    startTransition(async () => {
      const result = await probeSeoPageAction(page.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      recheck.watch(page);
      toast.success(`Checking ${page.path}…`);
    });
  }

  function remove() {
    if (!removing) return;
    startTransition(async () => {
      const result = await deleteSeoPageAction(removing.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onOverview(result.overview);
      setRemoving(null);
      toast.success(result.message);
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Pages</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Title, description and sharing image for each page. Posts and projects set theirs in their own edit form.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setEditing({ page: null, key: Date.now() })}>
          <Plus data-icon="inline-start" aria-hidden />
          Add page
        </Button>
      </div>

      {overview.pages.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="h-9 sm:max-w-xs">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, path or title"
              aria-label="Search pages"
              maxLength={120}
            />
          </InputGroup>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter pages">
            {FILTERS.map((entry) => {
              const count = overview.pages.filter(entry.match).length;
              return (
                <Button
                  key={entry.value}
                  type="button"
                  size="sm"
                  variant={filter === entry.value ? "secondary" : "ghost"}
                  aria-pressed={filter === entry.value}
                  onClick={() => setFilter(entry.value)}
                >
                  {entry.label}
                  <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      {overview.pages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
          <FileText className="size-5 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">No pages yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">Add the public paths you want search engines to see.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-8 text-center">
          <p className="text-sm font-medium">No pages match</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Clear search and filter
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
          {visible.map((page) => {
            const status = statusInfo(page.status);
            const checking = recheck.isWatching(page.id);

            return (
              <li key={page.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="truncate text-left text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      onClick={() => setEditing({ page, key: Date.now() })}
                    >
                      {page.label}
                    </button>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{page.path}</code>
                    <Badge variant="secondary">{PAGE_TYPE_LABELS[page.page_type] ?? page.page_type}</Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={cn(TONE[status.tone])}>
                          {checking ? "Checking…" : status.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {status.hint}
                        {page.status.checked_at ? ` Checked ${formatDateTime(page.status.checked_at, timeZone)}.` : ""}
                      </TooltipContent>
                    </Tooltip>
                    {!page.resolved.robots.index ? <Badge variant="outline">noindex</Badge> : null}
                    {page.resolved.robots.index && !page.resolved.in_sitemap ? (
                      <Badge variant="outline">Not in sitemap</Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-foreground/90">{page.resolved.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {page.resolved.description ?? "No description"}
                  </p>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("shrink-0 pt-0.5 text-sm font-semibold tabular-nums", scoreTone(page.completeness.score))}>
                      {page.completeness.score}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    <ul className="space-y-0.5">
                      {page.completeness.items.map((item) => (
                        <li key={item.key}>
                          {item.ok ? "✓" : "✗"} {item.label}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing({ page, key: Date.now() })}
                  aria-label={`Edit SEO for ${page.path}`}
                >
                  <Pencil data-icon="inline-start" aria-hidden />
                  Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`More actions for ${page.path}`}>
                      <MoreHorizontal aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={pending || checking} onSelect={() => probe(page)}>
                      <RefreshCw aria-hidden />
                      Re-check status
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={page.resolved.canonical_base} target="_blank" rel="noreferrer">
                        <ExternalLink aria-hidden />
                        Open page
                      </a>
                    </DropdownMenuItem>
                    {!page.is_system ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(page)}>
                          <Trash2 aria-hidden />
                          Remove
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SeoPageEditor
          key={editing.key}
          page={editing.page}
          open
          settings={overview.settings}
          options={overview.options}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSaved={(page, created) => {
            onPage(page);
            setEditing(null);
            if (created) recheck.watch(page);
          }}
        />
      ) : null}

      <Dialog open={removing !== null} onOpenChange={(open) => (!open ? setRemoving(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing?.path}?</DialogTitle>
            <DialogDescription>
              Its meta tags fall back to the site defaults and it leaves the sitemap. The page itself is not touched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoving(null)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={remove} disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
