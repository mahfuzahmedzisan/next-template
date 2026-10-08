"use client";

import { useRef, useState } from "react";
import { Check, Copy, Expand } from "lucide-react";

import { MediaPreviewLightbox } from "@/components/admin/media/media-preview-lightbox";
import { VideoPlayer } from "@/components/media/video-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}: {
  item: MediaRecord | null;
  onOpenChange: (open: boolean) => void;
  onSave: (body: { title: string; slug: string; alt: string; keywords: string[] }) => Promise<void>;
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
          <SheetDescription>
            {item ? `${item.kind} · ${item.status}` : "Details"}
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
}: {
  item: MediaRecord;
  url: string;
  poster: string | undefined;
  previewOpen: boolean;
  onPreview: (open: boolean) => void;
  onSave: (body: { title: string; slug: string; alt: string; keywords: string[] }) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [alt, setAlt] = useState(item.alt ?? "");
  const [keywords, setKeywords] = useState(item.keywords.join(", "));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const canPreview = item.kind === "image" ? Boolean(url) : Boolean(item.stream_url);

  return (
    <>
      <div className="flex flex-col gap-4 px-4">
        {item.kind === "image" && url ? (
          <button type="button" className="group relative block w-full" onClick={() => onPreview(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- storage URL is rewritten to this site */}
            <img src={url} alt={item.alt || item.title} className="w-full rounded-lg object-cover" />
            <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm">
              <Expand className="size-3.5" />
            </span>
          </button>
        ) : null}
        {(item.kind === "video" || item.kind === "audio") && item.stream_url ? (
          <div className="relative">
            <VideoPlayer src={item.stream_url} type="hls" poster={poster} />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="absolute top-2 right-2 bg-background/90"
              aria-label="Open preview"
              onClick={() => onPreview(true)}
            >
              <Expand />
            </Button>
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
          <Input id="detail-slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-url">URL</Label>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 pr-1">
            <Input
              id="detail-url"
              readOnly
              value={url}
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
        {(item.kind === "video" || item.kind === "audio") && item.stream_url ? (
          <div className="w-[min(96vw,960px)]">
            <VideoPlayer src={item.stream_url} type="hls" poster={poster} />
          </div>
        ) : null}
      </MediaPreviewLightbox>
    </>
  );
}
