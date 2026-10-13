"use client";

import { useRef, useState } from "react";
import { Check, Copy, Expand, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { RecordHistory } from "@/components/admin/audit/record-history";
import { MediaPreviewLightbox } from "@/components/admin/media/media-preview-lightbox";
import { VideoPlayer } from "@/components/media/video-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media";
import type { MediaRecord } from "@/lib/media/types";

export function MediaDetailSheet({
  item,
  onOpenChange,
  onSave,
  onRetry,
  onReupload,
  onCancel,
  onThumbnail,
}: {
  item: (MediaRecord & { uploadPercent?: number | null }) | null;
  onOpenChange: (open: boolean) => void;
  onSave: (body: { title: string; slug: string; alt: string; keywords: string[] }) => Promise<void>;
  onRetry: (id: number) => Promise<void>;
  onReupload: (id: number, file: File) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
  onThumbnail: (id: number, file: File) => Promise<void>;
}) {
  const url = toSameOriginStorageUrl(item?.url) ?? item?.url ?? "";
  const poster = toSameOriginStorageUrl(item?.poster_url) ?? item?.poster_url ?? undefined;
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewLock = useRef(false);

  function setPreview(open: boolean) {
    if (open) {
      previewLock.current = true;
      setPreviewOpen(true);
      return;
    }
    previewLock.current = true;
    setPreviewOpen(false);
    window.setTimeout(() => {
      previewLock.current = false;
    }, 250);
  }

  return (
    <Sheet
      open={item !== null}
      onOpenChange={(next) => {
        if (!next && previewLock.current) return;
        if (!next) setPreviewOpen(false);
        onOpenChange(next);
      }}
    >
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-md"
        onInteractOutside={(event) => {
          if (previewLock.current) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (previewLock.current) event.preventDefault();
        }}
        onFocusOutside={(event) => {
          if (previewLock.current) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (!previewLock.current) return;
          event.preventDefault();
          setPreview(false);
        }}
      >
        <SheetHeader>
          <SheetTitle>{item?.title ?? "Media"}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <span>{item ? `${item.kind} · ${item.status.replaceAll("_", " ")}` : "Details"}</span>
            {item && (item.kind === "video" || item.kind === "audio") && item.status === "ready" && item.stream_url ? (
              <Badge className="bg-sky-600 text-white hover:bg-sky-600">HLS</Badge>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        {item ? (
          <MediaDetailForm
            key={`${item.id}:${item.title}:${item.slug}:${item.alt ?? ""}:${item.keywords.join(",")}`}
            item={item}
            url={url}
            poster={poster}
            previewOpen={previewOpen}
            onPreview={setPreview}
            onSave={onSave}
            onRetry={onRetry}
            onReupload={onReupload}
            onCancel={onCancel}
            onThumbnail={onThumbnail}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function MediaDetailForm({
  item,
  url,
  poster,
  previewOpen,
  onPreview,
  onSave,
  onRetry,
  onReupload,
  onCancel,
  onThumbnail,
}: {
  item: MediaRecord & { uploadPercent?: number | null };
  url: string;
  poster: string | undefined;
  previewOpen: boolean;
  onPreview: (open: boolean) => void;
  onSave: (body: { title: string; slug: string; alt: string; keywords: string[] }) => Promise<void>;
  onRetry: (id: number) => Promise<void>;
  onReupload: (id: number, file: File) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
  onThumbnail: (id: number, file: File) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [alt, setAlt] = useState(item.alt ?? "");
  const [keywords, setKeywords] = useState(item.keywords.join(", "));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const thumbInput = useRef<HTMLInputElement>(null);
  const reuploadInput = useRef<HTMLInputElement>(null);
  const uploadMissing = item.status === "awaiting_upload";
  const streamable = item.kind === "video" || item.kind === "audio";

  async function generateSlug() {
    const name = title.trim();
    if (!name) return;
    setGenerating(true);
    try {
      const params = new URLSearchParams({ title: name, count: "1", except: String(item.id) });
      const response = await fetch(`/api/admin/media/slug-preview?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        data?: { slugs?: string[] };
      } | null;
      const next = payload?.data?.slugs?.[0];
      if (!response.ok || !next) {
        toast.error(payload?.message ?? "Unable to generate a slug.");
        return;
      }
      setSlug(next);
    } catch {
      toast.error("Unable to generate a slug.");
    } finally {
      setGenerating(false);
    }
  }
  const converting = item.status === "uploaded" || item.status === "processing";
  const canPreview = item.kind === "image" && Boolean(url);

  return (
    <>
      <div className="flex flex-col gap-4 px-4">
        {item.kind === "image" && url ? (
          <button type="button" className="group relative block w-full" onClick={() => onPreview(true)}>
            <ContainedPreview src={url} alt={item.alt || item.title} />
            <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm">
              <Expand className="size-3.5" />
            </span>
          </button>
        ) : null}
        {streamable && item.stream_url ? (
          <VideoPlayer src={item.stream_url} type="hls" poster={poster} className="aspect-[16/10] rounded-lg" />
        ) : null}
        {streamable && !item.stream_url ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
            {poster ? <ContainedPreview src={poster} alt="" /> : null}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{streamStatusTitle(item)}</p>
              <p className="text-xs text-muted-foreground">{streamStatusDetail(item)}</p>
              {item.status === "failed" && item.error_message ? (
                <details className="mt-1 min-w-0 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Technical details</summary>
                  <pre className="mt-2 max-h-28 max-w-full overflow-auto rounded-md bg-background p-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap text-muted-foreground">
                    {item.error_message}
                  </pre>
                </details>
              ) : null}
            </div>
            {item.status === "awaiting_upload" || converting ? (
              <Progress
                value={
                  item.status === "awaiting_upload"
                    ? item.uploadPercent ?? 8
                    : item.status === "uploaded"
                      ? 8
                      : item.progress
                }
              />
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={retrying || cancelling}
                onClick={() => {
                  if (uploadMissing) {
                    reuploadInput.current?.click();
                    return;
                  }
                  setRetrying(true);
                  void onRetry(item.id).finally(() => setRetrying(false));
                }}
              >
                {retrying ? "Starting" : uploadMissing ? "Upload again" : "Retry"}
              </Button>
              <input
                ref={reuploadInput}
                type="file"
                className="sr-only"
                accept={item.extension ? `.${item.extension}` : undefined}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setRetrying(true);
                  void onReupload(item.id, file).finally(() => setRetrying(false));
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={retrying || cancelling}
                onClick={() => {
                  setCancelling(true);
                  void onCancel(item.id).finally(() => setCancelling(false));
                }}
              >
                {cancelling ? "Cancelling" : "Cancel"}
              </Button>
            </div>
          </div>
        ) : null}
        {streamable ? (
          <div className="flex flex-col gap-2">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                {poster ? (
                  <ContainedPreview src={poster} alt="" />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                    None
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={thumbBusy}
                onClick={() => thumbInput.current?.click()}
              >
                {thumbBusy ? "Saving" : poster ? "Replace" : "Add thumbnail"}
              </Button>
              <input
                ref={thumbInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setThumbBusy(true);
                  void onThumbnail(item.id, file).finally(() => setThumbBusy(false));
                }}
              />
            </div>
          </div>
        ) : null}
        {item.kind === "pdf" && url ? (
          <a className="text-sm underline" href={url} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        ) : null}
        {item.kind === "document" && url ? (
          <a className="text-sm underline" href={url}>
            Download file
          </a>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-title">Name</Label>
          <Input id="detail-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-slug">Slug</Label>
          <InputGroup>
            <InputGroupInput id="detail-slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="secondary"
                disabled={generating || !title.trim()}
                onClick={() => void generateSlug()}
              >
                <WandSparkles aria-hidden />
                {generating ? "Generating" : "Generate"}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {!streamable ? (
            <p className="text-xs text-muted-foreground">
              Saving renames the file to match the slug. Links to the old URL keep working.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-url">URL</Label>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 pr-1">
            <Input
              id="detail-url"
              readOnly
              value={url}
              placeholder={url ? undefined : "Available after conversion"}
              className="border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={copied ? "Copied" : "Copy URL"}
              disabled={!url}
              onClick={() => {
                void navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-alt">Alternate text</Label>
          <Input id="detail-alt" value={alt} onChange={(event) => setAlt(event.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-keywords">Keywords</Label>
          <Input
            id="detail-keywords"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
          />
        </div>
        <RecordHistory subject={`media:${item.id}`} />
      </div>

      <SheetFooter>
        <Button
          type="button"
          disabled={saving || !title.trim() || !slug.trim()}
          onClick={() => {
            setSaving(true);
            void onSave({
              title: title.trim(),
              slug: slug.trim(),
              alt: alt.trim(),
              keywords: keywords
                .split(",")
                .map((keyword) => keyword.trim())
                .filter(Boolean),
            }).finally(() => setSaving(false));
          }}
        >
          Save
        </Button>
      </SheetFooter>
      <MediaPreviewLightbox open={previewOpen && canPreview} onClose={() => onPreview(false)} label={item.title}>
        {item.kind === "image" && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={item.alt || item.title} className="max-h-[90vh] max-w-[min(96vw,1100px)] object-contain" />
        ) : null}
      </MediaPreviewLightbox>
    </>
  );
}

function ContainedPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative block aspect-[16/10] overflow-hidden rounded-lg bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- blurred copy only fills the side bars */}
      <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-md" />
      {/* eslint-disable-next-line @next/next/no-img-element -- storage URL is rewritten to this site */}
      <img src={src} alt={alt} className="relative size-full object-contain" />
    </span>
  );
}

function streamStatusTitle(item: MediaRecord & { uploadPercent?: number | null }) {
  if (item.status === "failed") return "Conversion failed";
  if (item.status === "awaiting_upload" && item.uploadPercent != null) return `Uploading ${item.uploadPercent}%`;
  if (item.status === "awaiting_upload") return "Upload did not finish";
  if (item.status === "uploaded") return "Preparing the stream";
  if (item.status === "processing") return `Converting · ${item.progress}%`;
  return "Stream is not ready";
}

function streamStatusDetail(item: MediaRecord) {
  if (item.status === "failed") {
    return "This file could not be converted for playback. Try again, or cancel.";
  }
  if (item.status === "awaiting_upload") {
    return "The file never arrived, so conversion cannot start. Upload it again, or cancel.";
  }
  return "This file is being converted for playback. The link appears when that finishes.";
}
