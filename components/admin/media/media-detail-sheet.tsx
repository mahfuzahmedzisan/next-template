"use client";

import { useState } from "react";

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

  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
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
  onSave,
}: {
  item: MediaRecord;
  url: string;
  poster: string | undefined;
  onSave: (body: { title: string; slug: string; alt: string; keywords: string[] }) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [alt, setAlt] = useState(item.alt ?? "");
  const [keywords, setKeywords] = useState(item.keywords.join(", "));
  const [saving, setSaving] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 px-4">
        {item.kind === "image" && url ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL is rewritten to this site
          <img src={url} alt={item.alt || item.title} className="w-full rounded-lg object-cover" />
        ) : null}
        {(item.kind === "video" || item.kind === "audio") && item.stream_url ? (
          <VideoPlayer src={item.stream_url} type="hls" poster={poster} />
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
          <div className="flex gap-2">
            <Input id="detail-url" readOnly value={url} />
            <Button
              type="button"
              variant="outline"
              disabled={!url}
              onClick={() => void navigator.clipboard.writeText(url)}
            >
              Copy
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
    </>
  );
}
