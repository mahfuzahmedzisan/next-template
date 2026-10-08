"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  FileAudio,
  FileImage,
  FileText,
  Files,
  Film,
  LayoutGrid,
  Pause,
  Play,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import {
  fileKey,
  MediaUploadDialog,
  thumbnailFor,
  type UploadJob,
  type UploadRequest,
} from "@/components/admin/media/media-upload-dialog";
import { MediaDetailSheet } from "@/components/admin/media/media-detail-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media";
import { createMediaUpload, type TusUploadHandle } from "@/lib/media/tus-upload";
import type { MediaRecord, MediaStatus, MediaTypeFilter } from "@/lib/media/types";
import { getEcho } from "@/lib/realtime/echo";

const TABS: Array<{
  value: MediaTypeFilter;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "image", label: "Images", icon: FileImage },
  { value: "video", label: "Video", icon: Film },
  { value: "audio", label: "Audio", icon: FileAudio },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "document", label: "Documents", icon: Files },
];

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
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

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an unexpected response."
        : `The server returned an error (${response.status}).`,
    );
  }
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
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<MediaTypeFilter>(
    () => (searchParams.get("kind") as MediaTypeFilter | null) ?? "all",
  );
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
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
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [selected, setSelected] = useState<MediaRecord | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const uploads = useRef(new Map<number, TusUploadHandle>());
  const listRequest = useRef(0);
  const rowsRef = useRef(rows);
  const toasted = useRef(new Set<string>());
  const needsPoll = rows.some((row) => row.status === "uploaded" || row.status === "processing");

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  async function loadList(nextKind: MediaTypeFilter, nextQuery: string) {
    const requestId = ++listRequest.current;
    setListLoading(true);
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextKind !== "all") params.set("kind", nextKind);
    try {
      const response = await fetch(`/api/admin/media?${params.toString()}`, { credentials: "include" });
      if (!response.ok || requestId !== listRequest.current) return;
      const body = await readJson<{ data?: { media?: MediaRecord[] } }>(response);
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
    } catch {
      // Keep the current grid if the list request fails.
    } finally {
      if (requestId === listRequest.current) setListLoading(false);
    }
  }

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
      void fetch(`/api/admin/media?${params.toString()}`, { credentials: "include" })
        .then(async (response) => {
          if (!response.ok) return;
          const body = await readJson<{ data?: { media?: MediaRecord[] } }>(response);
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
  }, [needsPoll, q]);

  function selectKind(next: MediaTypeFilter) {
    if (next === kind) return;
    setKind(next);
    void loadList(next, q);
  }

  function patchJob(key: string, patch: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => (job.key === key ? { ...job, ...patch } : job)));
  }

  async function onUpload(request: UploadRequest) {
    setBusy(true);
    setJobs(
      request.files.map((file) => ({
        key: fileKey(file),
        name: file.name,
        percent: 0,
        state: "waiting",
      })),
    );

    for (const file of request.files) {
      const key = fileKey(file);
      const title = request.name || file.name.replace(/\.[^.]+$/, "") || file.name;
      const mime = mimeFor(file);
      if (!mime) {
        patchJob(key, { state: "error", message: "This file type is not allowed." });
        continue;
      }
      patchJob(key, { state: "uploading" });
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
        const body = await readJson<{
          message?: string;
          data?: {
            media_id: number;
            tus_endpoint: string;
            upload_token: string;
            media: MediaRecord;
          };
        }>(response);
        if (!response.ok || !body.data) {
          patchJob(key, { state: "error", message: body.message ?? "Unable to start the upload." });
          continue;
        }
        const created = body.data;
        patchJob(key, { mediaId: created.media_id });
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
            patchJob(key, { percent, state: "uploading" });
            setRows((current) =>
              current.map((row) =>
                row.id === created.media_id ? { ...row, uploadPercent: percent, paused: false } : row,
              ),
            );
          },
          onSuccess() {
            patchJob(key, { percent: 100, state: "done" });
            void fetch(`/api/admin/media/${created.media_id}`, { credentials: "include" })
              .then(async (result) => {
                if (!result.ok) return;
                const payload = await readJson<{ data?: { media?: MediaRecord } }>(result);
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
            patchJob(key, { state: "error", message: error.message });
            setRows((current) =>
              current.map((row) =>
                row.id === created.media_id ? { ...row, uploadError: error.message, paused: true } : row,
              ),
            );
          },
        });
        uploads.current.set(created.media_id, handle);
        handle.start();
      } catch (error) {
        patchJob(key, {
          state: "error",
          message: error instanceof Error ? error.message : "Unable to start the upload.",
        });
      }
    }
    setBusy(false);
  }

  async function onDelete(id: number) {
    const response = await fetch(`/api/admin/media/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const body = await readJson<{ message?: string }>(response);
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
    const payload = await readJson<{ message?: string; data?: { media?: MediaRecord } }>(response);
    if (!response.ok || !payload.data?.media) {
      toast.error(payload.message ?? "Unable to save.");
      return;
    }
    const media = payload.data.media;
    setRows((current) => current.map((row) => (row.id === media.id ? { ...row, ...media } : row)));
    setSelected(media);
    toast.success("Saved");
  }

  function pauseUpload(id: number) {
    uploads.current.get(id)?.pause();
    setRows((current) => current.map((item) => (item.id === id ? { ...item, paused: true } : item)));
    setJobs((current) =>
      current.map((job) => (job.mediaId === id ? { ...job, state: "paused" } : job)),
    );
  }

  function resumeUpload(id: number) {
    uploads.current.get(id)?.resume();
    setRows((current) => current.map((item) => (item.id === id ? { ...item, paused: false } : item)));
    setJobs((current) =>
      current.map((job) => (job.mediaId === id ? { ...job, state: "uploading" } : job)),
    );
  }

  const visibleRows = rows.filter((row) => kind === "all" || row.kind === kind);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          role="tablist"
          aria-label="Media type"
          className="flex flex-wrap gap-1 rounded-xl bg-muted/70 p-1"
        >
          {TABS.map((tab) => {
            const active = kind === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => selectKind(tab.value)}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <form
            className="relative min-w-0 flex-1 xl:w-72"
            onSubmit={(event) => {
              event.preventDefault();
              const next = query.trim();
              setQ(next);
              void loadList(kind, next);
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, alt, keywords"
              aria-label="Search media"
              className="pl-8"
            />
          </form>
          <Button type="button" onClick={() => setUploadOpen(true)}>
            <Upload data-icon="inline-start" />
            Upload
          </Button>
        </div>
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {listLoading ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index} className="overflow-hidden rounded-xl border bg-card">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="size-7 rounded-md" />
              </div>
            </li>
          ))}
        </ul>
      ) : visibleRows.length === 0 ? (
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-16 text-center hover:bg-muted/40"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Upload className="size-4" />
          </span>
          <span className="text-sm font-medium">{rows.length === 0 ? "No files yet" : "Nothing in this view"}</span>
          {rows.length === 0 ? (
            <span className="text-xs text-muted-foreground">Upload images, video, audio, or documents</span>
          ) : null}
        </button>
      ) : (
        <ul className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 xl:grid-cols-4">
          {visibleRows.map((row) => {
            const preview = toSameOriginStorageUrl(row.poster_url) ?? row.poster_url;
            const imagePreview =
              row.kind === "image"
                ? (toSameOriginStorageUrl(row.url) ?? row.url ?? preview)
                : preview;
            const showUpload = row.status === "awaiting_upload" && row.uploadPercent !== null;
            const encoding = row.status === "processing" || row.status === "uploaded";
            const Icon =
              row.kind === "video" ? Film :
              row.kind === "audio" ? FileAudio :
              row.kind === "pdf" ? FileText :
              row.kind === "document" ? Files :
              FileImage;
            return (
              <li key={row.id} className="self-start overflow-hidden rounded-xl border bg-card">
                <button type="button" className="block w-full text-left" onClick={() => setSelected(row)}>
                  <div className="relative aspect-[4/3] bg-muted">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element -- storage URL is rewritten to this site
                      <img src={imagePreview} alt={row.alt || row.title} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Icon className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 left-2 capitalize">
                      {row.kind}
                    </Badge>
                    <Badge
                      variant={row.status === "failed" ? "destructive" : "outline"}
                      className="absolute top-2 right-2 bg-background/90"
                    >
                      {statusLabel(row.status)}
                    </Badge>
                    {showUpload || encoding ? (
                      <div className="absolute inset-x-0 bottom-0 bg-background/80 px-2 py-1.5">
                        <Progress value={showUpload ? row.uploadPercent ?? 0 : row.progress} className="h-1" />
                      </div>
                    ) : null}
                  </div>
                </button>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelected(row)}>
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatSize(row.size) || row.extension?.toUpperCase() || row.kind}
                      {showUpload ? ` · ${row.uploadPercent}%` : ""}
                      {row.status === "processing" ? ` · ${row.progress}%` : ""}
                    </p>
                    {row.uploadError || (row.status === "failed" && row.error_message) ? (
                      <p className="truncate text-xs text-destructive">
                        {row.uploadError || row.error_message}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex shrink-0 items-center">
                    {showUpload ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={row.paused ? "Resume upload" : "Pause upload"}
                        onClick={() => (row.paused ? resumeUpload(row.id) : pauseUpload(row.id))}
                      >
                        {row.paused ? <Play /> : <Pause />}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${row.title}`}
                      onClick={() => void onDelete(row.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <MediaUploadDialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) setJobs([]);
        }}
        busy={busy}
        jobs={jobs}
        onSubmit={(request) => void onUpload(request)}
        onPause={pauseUpload}
        onResume={resumeUpload}
      />
      <MediaDetailSheet item={selected} onOpenChange={(open) => !open && setSelected(null)} onSave={onSave} />
    </div>
  );
}
