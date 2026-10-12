"use client";

import { Download, ExternalLink, FileCode2, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { regenerateSeoFilesAction } from "@/app/(admin)/admin/application/seo/actions";
import { formatSize } from "@/components/admin/application/backups/backup-meta";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SeoFileEntry, SeoFileName } from "@/lib/admin/seo-types";

const DESCRIPTIONS: Record<SeoFileName, string> = {
  sitemap: "Every indexable page, for search engines.",
  robots: "Which paths crawlers may visit.",
  llms: "A plain summary of the site for AI assistants.",
};

export function SeoFilesCard({
  files,
  timeZone,
  onFiles,
}: {
  files: SeoFileEntry[];
  timeZone: string;
  onFiles: (files: SeoFileEntry[]) => void;
}) {
  const [busy, setBusy] = useState<SeoFileName | "all" | null>(null);
  const [pending, startTransition] = useTransition();

  function regenerate(file: SeoFileName | "all") {
    setBusy(file);
    startTransition(async () => {
      const result = await regenerateSeoFilesAction(file);
      setBusy(null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onFiles(result.files);
      toast.success(result.message);
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Sitemap and robots</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Rebuilt automatically after every SEO change and every night. Regenerate to refresh them right now.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => regenerate("all")} disabled={pending}>
          <RefreshCw data-icon="inline-start" className={busy === "all" ? "animate-spin" : undefined} aria-hidden />
          Regenerate all
        </Button>
      </div>

      <ul className="grid gap-3 md:grid-cols-3">
        {files.map((file) => (
          <li key={file.file} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40">
                <FileCode2 className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{file.name}</p>
                  {!file.enabled ? <Badge variant="outline">Off</Badge> : null}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{DESCRIPTIONS[file.file]}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Generated</dt>
              <dd className="text-right">{file.generated_at ? formatDateTime(file.generated_at, timeZone) : "Not yet"}</dd>
              <dt className="text-muted-foreground">Size</dt>
              <dd className="text-right tabular-nums">{file.size !== null ? formatSize(file.size) : "—"}</dd>
              {file.urls !== null ? (
                <>
                  <dt className="text-muted-foreground">URLs</dt>
                  <dd className="text-right tabular-nums">{file.urls}</dd>
                </>
              ) : null}
            </dl>

            <div className="mt-auto flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => regenerate(file.file)}
                disabled={pending || !file.enabled}
              >
                <RefreshCw data-icon="inline-start" className={busy === file.file ? "animate-spin" : undefined} aria-hidden />
                Regenerate
              </Button>
              <Button asChild size="icon-sm" variant="ghost" aria-label={`Download ${file.name}`}>
                <a href={`/api/admin/seo/download/${file.file}`} aria-disabled={!file.enabled}>
                  <Download aria-hidden />
                </a>
              </Button>
              <Button asChild size="icon-sm" variant="ghost" aria-label={`Open ${file.name}`}>
                <a href={file.url} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden />
                </a>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
