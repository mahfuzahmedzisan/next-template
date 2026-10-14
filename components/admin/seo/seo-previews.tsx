"use client";

import { ImageIcon } from "lucide-react";

import { lengthState, type LengthState } from "@/components/admin/seo/seo-meta";
import { cn } from "cn";

const LENGTH_TONE: Record<LengthState, string> = {
  empty: "text-muted-foreground",
  short: "text-amber-600 dark:text-amber-400",
  good: "text-emerald-600 dark:text-emerald-400",
  long: "text-destructive",
};

const LENGTH_HINT: Record<LengthState, string> = {
  empty: "empty",
  short: "short",
  good: "good",
  long: "too long",
};

export function CharCount({
  value,
  range,
  id,
}: {
  value: string;
  range: { min: number; max: number };
  id?: string;
}) {
  const length = value.trim().length;
  const state = lengthState(length, range);

  return (
    <span id={id} className={cn("text-xs tabular-nums", LENGTH_TONE[state])} aria-live="polite">
      {length} / {range.min}–{range.max} · {LENGTH_HINT[state]}
    </span>
  );
}

function hostAndPath(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.split("/").filter(Boolean).join(" › ");
    return { host: parsed.host, path };
  } catch {
    return { host: url, path: "" };
  }
}

/** Approximates a Google result: titles cut near 60 characters, descriptions near 160. */
export function SearchPreview({
  title,
  description,
  url,
  siteName,
}: {
  title: string;
  description: string | null;
  url: string;
  siteName: string;
}) {
  const { host, path } = hostAndPath(url);

  return (
    <div className="rounded-xl border border-border/70 bg-background p-4">
      <p className="text-xs font-medium text-muted-foreground">Search result preview</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full border border-border/70 bg-muted text-xs font-semibold">
          {siteName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm">{siteName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {host}
            {path ? ` › ${path}` : ""}
          </p>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-lg leading-snug text-blue-700 dark:text-blue-400">{title}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
        {description || "No description. Search engines will pick text from the page."}
      </p>
    </div>
  );
}

export function SocialPreview({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string | null;
  image: string | null;
  url: string;
}) {
  const { host } = hostAndPath(url);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
      <div className="flex aspect-[1200/630] items-center justify-center bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="space-y-1 border-t border-border/70 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{host}</p>
        <p className="line-clamp-1 text-sm font-semibold">{title}</p>
        {description ? <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}
