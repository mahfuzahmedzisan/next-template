"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  MediaUploadDialog,
  thumbnailFor,
  type UploadRequest,
} from "@/components/admin/media/media-upload-dialog";
import { MediaDetailSheet } from "@/components/admin/media/media-detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media";
import { createMediaUpload, type TusUploadHandle } from "@/lib/media/tus-upload";
import type { MediaRecord, MediaStatus, MediaTypeFilter } from "@/lib/media/types";
import { getEcho } from "@/lib/realtime/echo";

const TABS: Array<{ value: MediaTypeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "Documents" },
];

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

type Row = MediaRecord & {
  uploadPercent: number | null;
  uploadError: string | null;
  paused: boolean;
};

type ProcessingPayload = {
  video_id?: number;
  status?: MediaStatus;
  progress?: number;
  stream_url?: string | null;
  error_message?: string | null;
};

function mimeFor(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? file.type;
}

function statusLabel(status: MediaStatus) {
  switch (status) {
    case "awaiting_upload":
      return "Uploading";
    case "uploaded":
      return "Queued";
    case "processing":
      return "Encoding";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
  }
}

function formatSize(size: number | null) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({
  userId,
  initialMedia,
  loadError,
}: {
  userId: string | number;
  initialMedia: MediaRecord[];
  loadError: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = (searchParams.get("kind") as MediaTypeFilter | null) ?? "all";
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [rows, setRows] = useState<Row[]>(() =>
    initialMedia.map((item) => ({
      ...item,
      uploadPercent: null,
      uploadError: null,
      paused: false,
    })),
  );
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<MediaRecord | null>(null);
  const uploads = useRef(new Map<number, TusUploadHandle>());
  const rowsRef = useRef(rows);
  const toasted = useRef(new Set<string>());
  const needsPoll = rows.some((row) => row.status === "uploaded" || row.status === "processing");

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kind !== "all") params.set("kind", kind);
    const handle = window.setTimeout(() => {
      void fetch(`/api/admin/media?${params.toString()}`, { credentials: "include" })
        .then(async (response) => {
          if (!response.ok) return;
          const body = (await response.json()) as { data?: { media?: MediaRecord[] } };
          const media = body.data?.media ?? [];
          setRows((current) => {
            const incoming = media.map((item) => {
              const existing = current.find((row) => row.id === item.id);
              return {
                ...item,
                uploadPercent: existing?.uploadPercent ?? null,
                uploadError: existing?.uploadError ?? null,
                paused: existing?.paused ?? false,
              };
            });
            const uploading = current.filter(
              (row) =>
                row.uploadPercent !== null &&
                row.status === "awaiting_upload" &&
                !incoming.some((item) => item.id === row.id),
            );
            return [...uploading, ...incoming];
          });
        })
        .catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q, kind]);

  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;
    const channel = echo.private(`App.Models.User.${userId}`);
    channel.listen(".video.processing", (payload: unknown) => {
      const data = (payload ?? {}) as ProcessingPayload;
      if (!data.video_id || !data.status) return;
      const status = data.status;
      setRows((current) =>
        current.map((row) =>
          row.id === data.video_id
            ? {
                ...row,
                status,
                progress: data.progress ?? row.progress,
                stream_url: toSameOriginStorageUrl(data.stream_url) ?? row.stream_url,
                url: toSameOriginStorageUrl(data.stream_url) ?? row.url,
                error_message: data.error_message ?? row.error_message,
              }
            : row,
        ),
      );
    });
    return () => {
      echo.leave(`private-App.Models.User.${userId}`);
    };
  }, [userId]);

  useEffect(() => {
    if (!needsPoll) return;
    const timer = window.setInterval(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (kind !== "all") params.set("kind", kind);
      void fetch(`/api/admin/media?${params.toString()}`, { credentials: "include" })
        .then(async (response) => {
          if (!response.ok) return;
          const body = (await response.json()) as { data?: { media?: MediaRecord[] } };
          const media = body.data?.media ?? [];
          setRows((current) =>
            current.map((row) => {
              const item = media.find((entry) => entry.id === row.id);
              return item
                ? { ...row, ...item, uploadPercent: item.status === "awaiting_upload" ? row.uploadPercent : null }
                : row;
            }),
          );
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [needsPoll, q, kind]);

  function writeQuery(next: { q?: string; kind?: MediaTypeFilter }) {
    const params = new URLSearchParams(searchParams.toString());
    const queryValue = next.q ?? q;
    const kindValue = next.kind ?? kind;
    if (queryValue) params.set("q", queryValue);
    else params.delete("q");
    if (kindValue !== "all") params.set("kind", kindValue);
    else params.delete("kind");
    const suffix = params.toString();
    router.replace(suffix ? `/admin/media?${suffix}` : "/admin/media");
  }

  async function onUpload(request: UploadRequest) {
    setBusy(true);
    for (const file of request.files) {
      const title = file.name.replace(/\.[^.]+$/, "") || file.name;
      const mime = mimeFor(file);
      if (!mime) {
        toast.error("This file type is not allowed.", { description: file.name });
        continue;
      }
      try {
        const response = await fetch("/api/admin/media", {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            filename: file.name,
            size: file.size,
            mime,
            alt: request.alt,
            keywords: request.keywords,
          }),
        });
        const body = (await response.json()) as {
          message?: string;
          data?: {
            media_id: number;
            tus_endpoint: string;
            upload_token: string;
            media: MediaRecord;
          };
        };
        if (!response.ok || !body.data) {
          toast.error(body.message ?? "Unable to start the upload.");
          continue;
        }
        const created = body.data;
        const cover = thumbnailFor(file, request);
        if (cover) {
          const form = new FormData();
          form.append("thumbnail", cover);
          await fetch(`/api/admin/media/${created.media_id}/thumbnail`, {
            method: "POST",
            credentials: "include",
            body: form,
          });
        }
        setRows((current) => [
          { ...created.media, uploadPercent: 0, uploadError: null, paused: false },
          ...current.filter((row) => row.id !== created.media.id),
        ]);
        const handle = createMediaUpload({
          file,
          endpoint: created.tus_endpoint,
          token: created.upload_token,
          mediaId: created.media_id,
          onProgress(percent) {
            setRows((current) =>
              current.map((row) =>
                row.id === created.media_id ? { ...row, uploadPercent: percent, paused: false } : row,
              ),
            );
          },
          onSuccess() {
            void fetch(`/api/admin/media/${created.media_id}`, { credentials: "include" })
              .then(async (result) => {
                if (!result.ok) return;
                const payload = (await result.json()) as { data?: { media?: MediaRecord } };
                if (!payload.data?.media) return;
                const media = payload.data.media;
                setRows((current) =>
                  current.map((row) =>
                    row.id === media.id ? { ...row, ...media, uploadPercent: null } : row,
                  ),
                );
                if (media.status === "ready" && !toasted.current.has(`${media.id}:ready`)) {
                  toasted.current.add(`${media.id}:ready`);
                  toast.success("File is ready", { description: media.title });
                }
              })
              .catch(() => undefined);
          },
          onError(error) {
            setRows((current) =>
              current.map((row) =>
                row.id === created.media_id ? { ...row, uploadError: error.message, paused: true } : row,
              ),
            );
            toast.error("Upload paused", { description: error.message });
          },
        });
        uploads.current.set(created.media_id, handle);
        handle.start();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to start the upload.");
      }
    }
    setBusy(false);
    setUploadOpen(false);
  }

  async function onDelete(id: number) {
    const response = await fetch(`/api/admin/media/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      toast.error(body.message ?? "Unable to delete this file.");
      return;
    }
    uploads.current.get(id)?.pause();
    uploads.current.delete(id);
    setRows((current) => current.filter((row) => row.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function onSave(body: { title: string; slug: string; alt: string; keywords: string[] }) {
    if (!selected) return;
    const response = await fetch(`/api/admin/media/${selected.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { message?: string; data?: { media?: MediaRecord } };
    if (!response.ok || !payload.data?.media) {
      toast.error(payload.message ?? "Unable to save.");
      return;
    }
    const media = payload.data.media;
    setRows((current) => current.map((row) => (row.id === media.id ? { ...row, ...media } : row)));
    setSelected(media);
    toast.success("Saved");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={kind}
          onValueChange={(value) => writeQuery({ kind: value as MediaTypeFilter })}
        >
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button type="button" onClick={() => setUploadOpen(true)}>
          Upload
        </Button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          writeQuery({ q: query.trim() });
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, slug, alt text, or keywords"
          aria-label="Search media"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          No files in this view yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => {
            const preview = toSameOriginStorageUrl(row.poster_url || row.url) ?? row.poster_url ?? row.url;
            const showUpload = row.status === "awaiting_upload" && row.uploadPercent !== null;
            return (
              <li key={row.id} className="flex flex-col gap-3 rounded-xl border p-4">
                <button type="button" className="text-left" onClick={() => setSelected(row)}>
                  {row.kind === "image" && preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- storage URL is rewritten to this site
                    <img src={preview} alt={row.alt || row.title} className="mb-3 aspect-video w-full rounded-lg object-cover" />
                  ) : (
                    <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                      {row.kind}
                    </div>
                  )}
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {statusLabel(row.status)}
                    {formatSize(row.size) ? ` · ${formatSize(row.size)}` : ""}
                    {showUpload ? ` · ${row.uploadPercent}%` : ""}
                    {row.status === "processing" ? ` · ${row.progress}%` : ""}
                  </p>
                </button>
                {showUpload ? (
                  <div className="flex gap-2">
                    {row.paused ? (
                      <Button type="button" variant="outline" onClick={() => uploads.current.get(row.id)?.resume()}>
                        Resume
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          uploads.current.get(row.id)?.pause();
                          setRows((current) =>
                            current.map((item) => (item.id === row.id ? { ...item, paused: true } : item)),
                          );
                        }}
                      >
                        Pause
                      </Button>
                    )}
                  </div>
                ) : null}
                {row.uploadError ? <p className="text-sm text-destructive">{row.uploadError}</p> : null}
                {row.status === "failed" && row.error_message ? (
                  <p className="text-sm text-destructive">{row.error_message}</p>
                ) : null}
                <Button type="button" variant="outline" onClick={() => void onDelete(row.id)}>
                  Delete
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <MediaUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        busy={busy}
        onSubmit={(request) => void onUpload(request)}
      />
      <MediaDetailSheet item={selected} onOpenChange={(open) => !open && setSelected(null)} onSave={onSave} />
    </div>
  );
}
