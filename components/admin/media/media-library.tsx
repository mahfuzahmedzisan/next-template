"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  ChevronLeft,
  ChevronRight,
  FileAudio,
  FileImage,
  FileText,
  Files,
  Film,
  LayoutGrid,
  Search,
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
import {
  MEDIA_VIEWS,
  MediaBrowser,
  getMediaView,
  perPageFor,
  setMediaView,
  subscribeMediaView,
  type MediaViewId,
} from "@/components/admin/media/media-view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media";
import { createMediaUpload, type TusUploadHandle } from "@/lib/media/tus-upload";
import type { MediaListResult, MediaRecord, MediaStatus, MediaTypeFilter } from "@/lib/media/types";
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
  initialMeta,
  loadError,
}: {
  userId: string | number;
  initialMedia: MediaRecord[];
  initialMeta: MediaListResult["meta"];
  loadError: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
  const view = useSyncExternalStore(subscribeMediaView, getMediaView, () => "large" as MediaViewId);
  const [page, setPage] = useState(initialMeta.current_page || 1);
  const [meta, setMeta] = useState(initialMeta);
  const [listLoading, setListLoading] = useState(false);
  const uploads = useRef(new Map<number, TusUploadHandle>());
  const listRequest = useRef(0);
  const rowsRef = useRef(rows);
  const toasted = useRef(new Set<string>());
  const openItem = selected ? rows.find((row) => row.id === selected.id) ?? selected : null;
  const needsPoll = rows.some((row) => row.status === "uploaded" || row.status === "processing");
  const watchId =
    openItem &&
    (openItem.status === "awaiting_upload" || openItem.status === "uploaded" || openItem.status === "processing")
      ? openItem.id
      : null;

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  async function loadList(
    nextKind: MediaTypeFilter,
    nextQuery: string,
    nextPage: number,
    nextPerPage: number,
  ) {
    const requestId = ++listRequest.current;
    setListLoading(true);
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextKind !== "all") params.set("kind", nextKind);
    params.set("page", String(nextPage));
    params.set("per_page", String(nextPerPage));
    try {
      const response = await fetch(`/api/admin/media?${params.toString()}`, { credentials: "include" });
      if (!response.ok || requestId !== listRequest.current) return;
      const body = await readJson<{ data?: MediaListResult }>(response);
      if (body.data?.meta) {
        setMeta(body.data.meta);
        setPage(body.data.meta.current_page);
      }
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
      if (kind !== "all") params.set("kind", kind);
      params.set("page", String(page));
      params.set("per_page", String(perPageFor(view)));
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
  }, [needsPoll, q, kind, page, view]);

  useEffect(() => {
    if (watchId === null || needsPoll) return;
    const timer = window.setInterval(() => {
      void fetch(`/api/admin/media/${watchId}`, { credentials: "include" })
        .then(async (response) => {
          if (!response.ok) return;
          const body = await readJson<{ data?: { media?: MediaRecord } }>(response);
          const media = body.data?.media;
          if (!media) return;
          setRows((current) =>
            current.map((row) =>
              row.id === media.id
                ? { ...row, ...media, uploadPercent: media.status === "awaiting_upload" ? row.uploadPercent : null }
                : row,
            ),
          );
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [watchId, needsPoll]);

  function selectKind(next: MediaTypeFilter) {
    if (next === kind) return;
    setKind(next);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("kind");
    else params.set("kind", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    void loadList(next, q, 1, perPageFor(view));
  }

  function selectView(next: MediaViewId) {
    const previous = view;
    setMediaView(next);
    if (perPageFor(next) === perPageFor(previous)) return;
    setPage(1);
    void loadList(kind, q, 1, perPageFor(next));
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

  function replaceRow(media: MediaRecord) {
    setRows((current) =>
      current.map((row) => (row.id === media.id ? { ...row, ...media, uploadPercent: null } : row)),
    );
  }

  async function onRetry(id: number) {
    const response = await fetch(`/api/admin/media/${id}/retry`, {
      method: "POST",
      credentials: "include",
    });
    const body = await readJson<{ data?: { media?: MediaRecord }; message?: string }>(response);
    if (!response.ok || !body.data?.media) {
      toast.error(body.message ?? "Unable to retry the conversion.");
      return;
    }
    replaceRow(body.data.media);
  }

  async function onReupload(id: number, file: File) {
    const mime = mimeFor(file);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const row = rows.find((entry) => entry.id === id);
    if (!mime) {
      toast.error("This file type is not allowed.");
      return;
    }
    if (row?.extension && extension !== row.extension) {
      toast.error(`Choose a .${row.extension} file. That is the file this item is waiting for.`);
      return;
    }
    const response = await fetch(`/api/admin/media/${id}/resume`, {
      method: "POST",
      credentials: "include",
    });
    const body = await readJson<{
      data?: { media_id: number; tus_endpoint: string; upload_token: string };
      message?: string;
    }>(response);
    if (!response.ok || !body.data) {
      toast.error(body.message ?? "Unable to start the upload again.");
      return;
    }
    const created = body.data;
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, uploadPercent: 0, uploadError: null, paused: false } : row)),
    );
    const handle = createMediaUpload({
      file,
      endpoint: created.tus_endpoint,
      token: created.upload_token,
      mediaId: created.media_id,
      onProgress(percent) {
        setRows((current) =>
          current.map((row) => (row.id === id ? { ...row, uploadPercent: percent, paused: false } : row)),
        );
      },
      onSuccess() {
        void fetch(`/api/admin/media/${id}`, { credentials: "include" })
          .then(async (result) => {
            if (!result.ok) return;
            const payload = await readJson<{ data?: { media?: MediaRecord } }>(result);
            if (!payload.data?.media) return;
            replaceRow(payload.data.media);
          })
          .catch(() => undefined);
      },
      onError(error) {
        setRows((current) =>
          current.map((row) =>
            row.id === id ? { ...row, uploadError: error.message, paused: true } : row,
          ),
        );
        toast.error(error.message);
      },
    });
    uploads.current.set(id, handle);
    handle.start();
  }

  async function onThumbnail(id: number, file: File) {
    const form = new FormData();
    form.append("thumbnail", file);
    const response = await fetch(`/api/admin/media/${id}/thumbnail`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const body = await readJson<{ data?: { media?: MediaRecord }; message?: string }>(response);
    if (!response.ok || !body.data?.media) {
      toast.error(body.message ?? "Unable to update the thumbnail.");
      return;
    }
    replaceRow(body.data.media);
    toast.success("Thumbnail updated");
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
              setPage(1);
              void loadList(kind, next, 1, perPageFor(view));
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline">
                <LayoutGrid data-icon="inline-start" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {MEDIA_VIEWS.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <DropdownMenuItem key={item.id} onSelect={() => selectView(item.id)}>
                    <span className="flex w-3 justify-center">
                      {active ? <span className="size-1.5 rounded-full bg-foreground" /> : null}
                    </span>
                    <Icon />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" onClick={() => setUploadOpen(true)}>
            <Upload data-icon="inline-start" />
            Upload
          </Button>
        </div>
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {listLoading || visibleRows.length > 0 ? (
        <MediaBrowser
          view={view}
          rows={visibleRows}
          loading={listLoading}
          onOpen={setSelected}
          onDelete={(id) => void onDelete(id)}
          onPause={pauseUpload}
          onResume={resumeUpload}
        />
      ) : (
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
      )}

      {meta.last_page > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {(meta.current_page - 1) * meta.per_page + 1}
            –
            {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={listLoading || meta.current_page <= 1}
              onClick={() => void loadList(kind, q, meta.current_page - 1, perPageFor(view))}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center text-xs text-muted-foreground">
              {meta.current_page} / {meta.last_page}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={listLoading || meta.current_page >= meta.last_page}
              onClick={() => void loadList(kind, q, meta.current_page + 1, perPageFor(view))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}


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
      <MediaDetailSheet
        item={openItem}
        onOpenChange={(open) => !open && setSelected(null)}
        onSave={onSave}
        onRetry={onRetry}
        onReupload={onReupload}
        onCancel={onDelete}
        onThumbnail={onThumbnail}
      />
    </div>
  );
}
