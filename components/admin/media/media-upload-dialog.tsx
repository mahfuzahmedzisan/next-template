"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Files,
  ImagePlus,
  Upload,
  X,
} from "lucide-react";

import { MediaPreviewLightbox } from "@/components/admin/media/media-preview-lightbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const MAX_UPLOAD_FILES = 10;

const ACCEPT = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg",
  ".mp4", ".mov", ".webm", ".mkv",
  ".mp3", ".wav", ".m4a", ".ogg",
  ".pdf", ".txt", ".csv", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
].join(",");

const STREAM_EXTENSIONS = new Set(["mp4", "mov", "webm", "mkv", "mp3", "wav", "m4a", "ogg"]);

export type ThumbnailMode = "shared" | "individual";

export type UploadJob = {
  key: string;
  name: string;
  percent: number;
  state: "waiting" | "uploading" | "paused" | "done" | "error";
  message?: string;
  mediaId?: number;
};

export type UploadRequest = {
  files: File[];
  name: string;
  alt: string;
  keywords: string[];
  thumbnailMode: ThumbnailMode;
  sharedThumbnail: File | null;
  thumbnails: Record<string, File | null>;
};

type Preview = {
  key: string;
  file: File;
  url: string;
  kind: "image" | "video" | "audio" | "pdf" | "document";
};

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function kindFor(file: File): Preview["kind"] {
  const extension = extensionOf(file.name);
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)) return "image";
  if (["mp4", "mov", "webm", "mkv"].includes(extension)) return "video";
  if (["mp3", "wav", "m4a", "ogg"].includes(extension)) return "audio";
  if (extension === "pdf") return "pdf";
  return "document";
}

function needsThumbnail(file: File) {
  return STREAM_EXTENSIONS.has(extensionOf(file.name));
}

function formatSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_BADGE: Record<Preview["kind"], string> = {
  image: "bg-sky-600 text-white",
  video: "bg-violet-600 text-white",
  audio: "bg-amber-500 text-white",
  pdf: "bg-rose-600 text-white",
  document: "bg-emerald-700 text-white",
};

function KindIcon({ kind }: { kind: Preview["kind"] }) {
  const Icon =
    kind === "image" ? FileImage :
    kind === "video" ? FileVideo :
    kind === "audio" ? FileAudio :
    kind === "pdf" ? FileText :
    Files;
  return <Icon className="size-5 text-muted-foreground" />;
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  busy,
  jobs,
  onSubmit,
  onPause,
  onResume,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  jobs: UploadJob[];
  onSubmit: (request: UploadRequest) => void;
  onPause: (mediaId: number) => void;
  onResume: (mediaId: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState("");
  const [limitNote, setLimitNote] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [alt, setAlt] = useState("");
  const [keywords, setKeywords] = useState("");
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailMode>("shared");
  const [sharedThumbnail, setSharedThumbnail] = useState<File | null>(null);
  const [sharedPreview, setSharedPreview] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, File | null>>({});
  const [coverPreviews, setCoverPreviews] = useState<Record<string, string>>({});
  const previewsRef = useRef(previews);
  const sharedPreviewRef = useRef(sharedPreview);
  const coverPreviewsRef = useRef(coverPreviews);

  useEffect(() => {
    previewsRef.current = previews;
    sharedPreviewRef.current = sharedPreview;
    coverPreviewsRef.current = coverPreviews;
  });

  const streamable = useMemo(
    () => previews.filter((item) => needsThumbnail(item.file)),
    [previews],
  );
  const transferring = jobs.length > 0;
  const lightboxItems = useMemo(
    () => previews.filter((item) => item.kind === "image" || item.kind === "video"),
    [previews],
  );

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
      if (sharedPreviewRef.current) URL.revokeObjectURL(sharedPreviewRef.current);
      Object.values(coverPreviewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function revokeAll() {
    previewsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    if (sharedPreviewRef.current) URL.revokeObjectURL(sharedPreviewRef.current);
    Object.values(coverPreviewsRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    previewsRef.current = [];
    sharedPreviewRef.current = null;
    coverPreviewsRef.current = {};
  }

  function requestClose() {
    if (busy) return;
    reset();
    onOpenChange(false);
  }

  function reset() {
    revokeAll();
    setPreviews([]);
    setName("");
    setLimitNote(null);
    setLightboxIndex(null);
    setAlt("");
    setKeywords("");
    setThumbnailMode("shared");
    setSharedThumbnail(null);
    setSharedPreview(null);
    setThumbnails({});
    setCoverPreviews({});
    setDragging(false);
  }

  function addFiles(incoming: File[]) {
    if (incoming.length === 0 || transferring) return;
    const room = MAX_UPLOAD_FILES - previews.length;
    if (room <= 0) {
      setLimitNote(`You can upload ${MAX_UPLOAD_FILES} files at a time.`);
      return;
    }
    const seen = new Set(previews.map((item) => item.key));
    const next = [...previews];
    let skipped = false;
    for (const file of incoming) {
      if (next.length >= MAX_UPLOAD_FILES) {
        skipped = true;
        break;
      }
      const key = fileKey(file);
      if (seen.has(key)) continue;
      seen.add(key);
      next.push({ key, file, url: URL.createObjectURL(file), kind: kindFor(file) });
    }
    setLimitNote(skipped ? `Only ${MAX_UPLOAD_FILES} files can be added at a time.` : null);
    setPreviews(next);
  }

  function removeFile(key: string) {
    setPreviews((current) => {
      const item = current.find((entry) => entry.key === key);
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((entry) => entry.key !== key);
    });
    setThumbnails((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setCoverPreviews((current) => {
      const url = current[key];
      if (url) URL.revokeObjectURL(url);
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function setSharedCover(file: File | null) {
    setSharedThumbnail(file);
    setSharedPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function setIndividualCover(key: string, file: File | null) {
    setThumbnails((current) => ({ ...current, [key]: file }));
    setCoverPreviews((current) => {
      const previous = current[key];
      if (previous) URL.revokeObjectURL(previous);
      return { ...current, [key]: file ? URL.createObjectURL(file) : "" };
    });
  }

  const finished = transferring && jobs.every((job) => job.state === "done" || job.state === "error");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else requestClose();
      }}
    >
      <DialogContent
        className="flex max-h-[min(88vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onEscapeKeyDown={(event) => {
          if (lightboxIndex === null) return;
          event.preventDefault();
          setLightboxIndex(null);
        }}
        onInteractOutside={(event) => {
          if (lightboxIndex !== null) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (lightboxIndex !== null) event.preventDefault();
        }}
        onFocusOutside={(event) => {
          if (lightboxIndex !== null) event.preventDefault();
        }}
      >
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{transferring ? "Uploading" : "Upload media"}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {transferring ? (
            <ul className="flex flex-col gap-2">
              {jobs.map((job) => {
                const preview = previews.find((item) => item.key === job.key);
                return (
                  <li key={job.key} className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
                    <PreviewThumb preview={preview} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">{job.name}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {job.state === "error" ? "Failed" : job.state === "done" ? "Done" : `${job.percent}%`}
                        </span>
                      </div>
                      <Progress
                        value={job.state === "done" ? 100 : job.percent}
                        className="mt-2 h-1.5"
                      />
                      {job.message ? (
                        <p className="mt-1 truncate text-xs text-destructive">{job.message}</p>
                      ) : null}
                    </div>
                    {job.mediaId && (job.state === "uploading" || job.state === "paused") ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          job.state === "paused" ? onResume(job.mediaId!) : onPause(job.mediaId!)
                        }
                      >
                        {job.state === "paused" ? "Resume" : "Pause"}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <>
              {previews.length < MAX_UPLOAD_FILES ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                  setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  addFiles(Array.from(event.dataTransfer.files));
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
                  dragging ? "border-foreground bg-muted" : "border-border bg-muted/30 hover:bg-muted/60",
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-background ring-1 ring-foreground/10">
                  <Upload className="size-4" />
                </span>
                <span className="text-sm font-medium">Drop files here, or browse</span>
                <span className="text-xs text-muted-foreground">
                  Up to {MAX_UPLOAD_FILES} files
                </span>
              </button>
              ) : null}
              {limitNote ? <p className="text-xs text-destructive">{limitNote}</p> : null}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />

              {previews.length > 0 ? (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {previews.map((item) => {
                    const slideIndex = lightboxItems.findIndex((slide) => slide.key === item.key);
                    return (
                      <li key={item.key} className="overflow-hidden rounded-lg border bg-card">
                        <div className="relative aspect-square bg-muted">
                          <button
                            type="button"
                            className="size-full"
                            aria-label={`Preview ${item.file.name}`}
                            disabled={slideIndex < 0}
                            onClick={() => setLightboxIndex(slideIndex)}
                          >
                            <PreviewMedia preview={item} />
                          </button>
                          <span
                            className={cn(
                              "pointer-events-none absolute top-1 left-1 rounded px-1 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                              TYPE_BADGE[item.kind],
                            )}
                          >
                            {item.kind === "document" ? "Doc" : item.kind}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${item.file.name}`}
                            className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-foreground/10"
                            onClick={() => removeFile(item.key)}
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                        <div className="px-1.5 py-1">
                          <p className="truncate text-[11px] font-medium">{item.file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatSize(item.file.size)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="media-name">Name</Label>
                  <Input
                    id="media-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Shared title"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="media-alt">Alt text</Label>
                  <Input
                    id="media-alt"
                    value={alt}
                    onChange={(event) => setAlt(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="media-keywords">Keywords</Label>
                  <Input
                    id="media-keywords"
                    value={keywords}
                    onChange={(event) => setKeywords(event.target.value)}
                    placeholder="interview, launch"
                  />
                </div>
              </div>

              {streamable.length > 0 ? (
                <div className="flex flex-col gap-3 rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">Cover</p>
                    <div className="flex rounded-lg bg-muted p-0.5">
                      {(["shared", "individual"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={cn(
                            "h-7 rounded-md px-2.5 text-xs font-medium",
                            thumbnailMode === mode ? "bg-background shadow-sm" : "text-muted-foreground",
                          )}
                          onClick={() => setThumbnailMode(mode)}
                        >
                          {mode === "shared" ? "One cover" : "Per file"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {thumbnailMode === "shared" ? (
                    <CoverPicker
                      preview={sharedPreview}
                      label={sharedThumbnail?.name ?? "Choose a cover image"}
                      onPick={() => coverRef.current?.click()}
                      onClear={sharedThumbnail ? () => setSharedCover(null) : undefined}
                    />
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {streamable.map((item) => (
                        <li key={item.key} className="flex items-center gap-3">
                          <CoverPicker
                            preview={coverPreviews[item.key] || null}
                            label={thumbnails[item.key]?.name ?? item.file.name}
                            onPick={() => {
                              const input = document.getElementById(`cover-${item.key}`) as HTMLInputElement | null;
                              input?.click();
                            }}
                            onClear={
                              thumbnails[item.key]
                                ? () => setIndividualCover(item.key, null)
                                : undefined
                            }
                          />
                          <input
                            id={`cover-${item.key}`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            onChange={(event) =>
                              setIndividualCover(item.key, event.target.files?.[0] ?? null)
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                  <input
                    ref={coverRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) => {
                      setSharedCover(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2 border-t bg-background px-5 py-4">
          {transferring ? (
            <Button
              type="button"
              variant={finished ? "default" : "outline"}
              disabled={busy}
              onClick={requestClose}
            >
              {busy ? "Starting…" : finished ? "Done" : "Close"}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={requestClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={previews.length === 0}
                onClick={() =>
                  onSubmit({
                    files: previews.map((item) => item.file),
                    name: name.trim(),
                    alt: alt.trim(),
                    keywords: keywords
                      .split(",")
                      .map((keyword) => keyword.trim())
                      .filter(Boolean),
                    thumbnailMode,
                    sharedThumbnail,
                    thumbnails,
                  })
                }
              >
                {`Upload${previews.length ? ` ${previews.length}` : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      <MediaPreviewLightbox
        open={lightboxIndex !== null && lightboxItems[lightboxIndex] !== undefined}
        onClose={() => setLightboxIndex(null)}
        label={lightboxItems[lightboxIndex ?? -1]?.file.name ?? "Preview"}
      >
        {lightboxItems[lightboxIndex ?? -1] ? (
          <PreviewStage preview={lightboxItems[lightboxIndex ?? -1]} />
        ) : null}
      </MediaPreviewLightbox>
    </Dialog>
  );
}

function PreviewThumb({ preview }: { preview: Preview | undefined }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
      {preview ? <PreviewMedia preview={preview} /> : null}
    </div>
  );
}

function PreviewStage({ preview }: { preview: Preview }) {
  if (preview.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={preview.url} alt={preview.file.name} className="max-h-[90vh] max-w-[min(96vw,1100px)] object-contain" />
    );
  }
  if (preview.kind === "video") {
    return (
      <video src={preview.url} controls autoPlay className="max-h-[90vh] max-w-[min(96vw,1100px)]" />
    );
  }
  return null;
}

function PreviewMedia({ preview }: { preview: Preview }) {
  if (preview.kind === "image") {
    return (
      // Local object URL from a file the user just picked.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={preview.url} alt="" className="size-full object-cover" />
    );
  }
  if (preview.kind === "video") {
    return <video src={preview.url} muted className="size-full object-cover" />;
  }
  return (
    <div className="flex size-full items-center justify-center">
      <KindIcon kind={preview.kind} />
    </div>
  );
}

function CoverPicker({
  preview,
  label,
  onPick,
  onClear,
}: {
  preview: string | null;
  label: string;
  onPick: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <button
        type="button"
        onClick={onPick}
        className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-4 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{label}</p>
        <div className="mt-1 flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPick}>
            Browse
          </Button>
          {onClear ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function thumbnailFor(file: File, request: UploadRequest) {
  if (!needsThumbnail(file)) return null;
  if (request.thumbnailMode === "shared") return request.sharedThumbnail;
  return request.thumbnails[fileKey(file)] ?? null;
}
