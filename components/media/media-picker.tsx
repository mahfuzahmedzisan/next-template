"use client";

import { useEffect, useState } from "react";
import { ClipboardPaste, ImageOff, Search, SearchX, X } from "lucide-react";
import { toast } from "sonner";

import { SideSheet } from "@/components/overlay/side-sheet";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { matchesAccept, namePastedFile } from "@/lib/file-upload";
import { acceptFor, allowedMediaUrl, clampMediaMax, extensionOf } from "@/lib/media/accept";
import { uploadMediaFile, type UploadPhase } from "@/lib/media/upload-client";
import type { MediaKind, MediaListResult, MediaRecord } from "@/lib/media/types";
import { cn } from "@/lib/utils";

export type MediaChoice = {
  url: string;
  title?: string;
  mediaId?: number;
  mime?: string;
};

type Job = {
  name: string;
  phase: UploadPhase | "waiting" | "done" | "error";
  percent: number;
  message?: string;
};

function choiceFromRecord(record: MediaRecord): MediaChoice | null {
  const raw = record.url ?? record.stream_url;
  const url = raw ? allowedMediaUrl(raw, []) : null;
  if (!url) return null;
  return {
    url,
    title: record.title,
    mediaId: record.id,
    mime: record.mime ?? undefined,
  };
}

function previewKind(url: string): "image" | "video" | "audio" | "file" {
  const extension = extensionOf(url);
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(extension)) return "image";
  if (["mp4", "mov", "webm", "mkv"].includes(extension)) return "video";
  if (["mp3", "wav", "m4a", "ogg"].includes(extension)) return "audio";
  return "file";
}

function MediaPreview({ url, label }: { url: string; label: string }) {
  const kind = previewKind(url);
  if (kind === "image") {
    // Storage and pasted URLs are not known to the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="size-full object-contain" />;
  }
  if (kind === "video") {
    return <video src={url} className="size-full object-contain" muted />;
  }
  if (kind === "audio") {
    return <audio src={url} controls className="w-full" aria-label={label} />;
  }
  return <span className="px-2 text-center text-xs text-muted-foreground">{label}</span>;
}

export function MediaPicker({
  open,
  onOpenChange,
  title = "Choose media",
  description = "Pick from the library, upload a file, or paste a URL.",
  accept = [],
  max = 1,
  value = [],
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  accept?: MediaKind[];
  max?: number;
  value?: MediaChoice[];
  onConfirm: (choices: MediaChoice[]) => void;
}) {
  const limit = clampMediaMax(max);
  const kinds = accept;
  const kindsKey = kinds.join(",");
  const fileAccept = acceptFor(kinds).accept;
  const [tab, setTab] = useState("media");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [library, setLibrary] = useState<{ key: string; rows: MediaRecord[] } | null>(null);
  const [selected, setSelected] = useState<MediaChoice[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [uploading, setUploading] = useState(false);
  const [urlText, setUrlText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTab("media");
      setQuery("");
      setDebounced("");
      setLibrary(null);
      setSelected(value.slice(0, limit));
      setUrlText(value.map((item) => item.url).join("\n"));
      setFiles([]);
      setJobs([]);
      setError(null);
      setUploading(false);
    }
  }

  const requestKey = `${debounced}\n${kindsKey}`;
  const rows = library?.key === requestKey ? library.rows : [];
  const loading = open && tab === "media" && library?.key !== requestKey;
  const choices = rows.flatMap((row) => {
    const choice = choiceFromRecord(row);
    return choice && allowedMediaUrl(choice.url, kinds) ? [{ row, choice }] : [];
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open || tab !== "media") return;
    const controller = new AbortController();
    const key = requestKey;
    const params = new URLSearchParams({ per_page: "24", status: "ready", page: "1" });
    if (debounced) params.set("q", debounced);
    if (kindsKey) params.set("kind", kindsKey);

    void fetch(`/api/admin/media?${params.toString()}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as { data?: MediaListResult; message?: string };
        if (!response.ok) throw new Error(body.message ?? "Unable to load media.");
        if (!controller.signal.aborted) setLibrary({ key, rows: body.data?.media ?? [] });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setLibrary({ key, rows: [] });
      });

    return () => controller.abort();
  }, [open, tab, debounced, kindsKey, requestKey]);

  function toggle(choice: MediaChoice) {
    setSelected((current) => {
      const exists = current.some((item) => item.url === choice.url);
      if (limit === 1) return exists ? [] : [choice];
      if (exists) return current.filter((item) => item.url !== choice.url);
      if (current.length >= limit) return current;
      return [...current, choice];
    });
  }

  function confirm(choices: MediaChoice[]) {
    onConfirm(choices.slice(0, limit));
    onOpenChange(false);
  }

  async function pasteClipboard() {
    try {
      const items = await navigator.clipboard.read();
      const stamp = new Date();
      const next: File[] = [];
      for (const item of items) {
        const type = item.types.find((entry) => matchesAccept(new File([], "paste", { type: entry }), fileAccept));
        if (!type) continue;
        const blob = await item.getType(type);
        const file = namePastedFile(new File([blob], "image.png", { type }), next.length, stamp);
        if (matchesAccept(file, fileAccept)) next.push(file);
      }
      if (next.length === 0) {
        toast.error("Clipboard has no matching file.");
        return;
      }
      setFiles((current) => [...current, ...next].slice(0, limit));
    } catch {
      toast.error("Allow clipboard access, or press Ctrl+V.");
    }
  }

  async function startUpload() {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setError(null);
    const ready: MediaChoice[] = [];
    setJobs(files.map((file) => ({ name: file.name, phase: "waiting", percent: 0 })));

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const media = await uploadMediaFile(file, (phase, percent) => {
          setJobs((current) =>
            current.map((job, jobIndex) => (jobIndex === index ? { ...job, phase, percent } : job)),
          );
        });
        const choice = choiceFromRecord(media);
        if (!choice || !allowedMediaUrl(choice.url, kinds)) {
          throw new Error("Uploaded file has no usable URL.");
        }
        ready.push({ ...choice, url: allowedMediaUrl(choice.url, kinds) ?? choice.url });
        setJobs((current) =>
          current.map((job, jobIndex) =>
            jobIndex === index ? { ...job, phase: "done", percent: 100 } : job,
          ),
        );
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Upload failed.";
        setJobs((current) =>
          current.map((job, jobIndex) =>
            jobIndex === index ? { ...job, phase: "error", message } : job,
          ),
        );
        setError(message);
        setUploading(false);
        return;
      }
    }

    const next = limit === 1 ? ready.slice(0, 1) : [...selected, ...ready].slice(0, limit);
    setSelected(next);
    setFiles([]);
    setUploading(false);
    onConfirm(next);
    if (limit === 1 || next.length >= limit) onOpenChange(false);
  }

  const urlLines = urlText
    .split(/\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const parsedUrls = urlLines.map((line) => allowedMediaUrl(line, kinds));
  const urlError =
    urlLines.length > limit
      ? `Use at most ${limit} ${limit === 1 ? "URL" : "URLs"}.`
      : parsedUrls.some((url) => !url)
        ? "One of the URLs is not an allowed file address."
        : null;

  return (
    <SideSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        tab === "upload" ? (
          <Button type="button" disabled={uploading || files.length === 0} onClick={() => void startUpload()}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={tab === "url" ? Boolean(urlError) || parsedUrls.length === 0 : selected.length === 0}
            onClick={() => {
              if (tab === "url") {
                const choices = parsedUrls.flatMap((url) => (url ? [{ url }] : []));
                confirm(choices);
                return;
              }
              confirm(selected);
            }}
          >
            Use
          </Button>
        )
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3">
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, slug, URL, or keywords"
              className="pl-8"
            />
          </div>
          {loading ? (
            <div className="mt-4 grid grid-cols-3 gap-2" aria-busy="true" aria-label="Searching media">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex flex-col gap-1 rounded-lg border p-1.5">
                  <Skeleton className="h-16" />
                  <Skeleton className="mx-0.5 h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : choices.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                {debounced ? (
                  <SearchX className="size-5 text-muted-foreground" />
                ) : (
                  <ImageOff className="size-5 text-muted-foreground" />
                )}
              </span>
              <p className="mt-3 text-sm font-medium">{debounced ? "No matching files" : "No files yet"}</p>
              <p className="mt-1 max-w-64 text-xs text-muted-foreground">
                {debounced
                  ? `Nothing matches “${debounced}”. Try another name, slug, or keyword.`
                  : "Upload a file or add one by URL to see it here."}
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {choices.map(({ row, choice }) => {
                const active = selected.some((item) => item.url === choice.url);
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => toggle(choice)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-1.5 text-left",
                      active ? "border-primary ring-2 ring-primary/30" : "border-border",
                    )}
                  >
                    <span className="flex h-16 items-center justify-center overflow-hidden rounded-md bg-muted">
                      <MediaPreview url={choice.url} label={row.title} />
                    </span>
                    <span className="truncate px-0.5 text-xs">{row.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {limit === 1 ? "1 file" : `Up to ${limit} files`}
            </p>
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => void pasteClipboard()}>
              <ClipboardPaste />
              Paste
            </Button>
          </div>
          <FileUpload
            value={limit === 1 ? (files[0] ?? null) : files}
            onChange={(next) => {
              const list = !next ? [] : Array.isArray(next) ? next : [next];
              setFiles(list.slice(0, limit));
            }}
            multiple={limit > 1}
            maxFiles={limit > 1 ? limit : undefined}
            accept={fileAccept}
            paste={!uploading}
            disabled={uploading}
            placeholder="Add files"
            classNames={{
              dropzone: "flex-row items-center justify-start gap-3 px-3 py-2.5",
              dropzoneContent:
                "w-auto flex-row flex-wrap items-center justify-start gap-x-2 gap-y-0 text-left [&_svg]:size-4",
            }}
          />
          {jobs.length > 0 ? (
            <ul className="space-y-2">
              {jobs.map((job) => (
                <li key={job.name} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="truncate font-medium">{job.name}</p>
                  <p className="text-muted-foreground">
                    {job.phase === "uploading"
                      ? `Uploading ${job.percent}%`
                      : job.phase === "converting"
                        ? "Converting…"
                        : job.phase === "done"
                          ? "Ready"
                          : job.phase === "error"
                            ? job.message
                            : "Waiting"}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </TabsContent>

        <TabsContent value="url" className="space-y-3 px-4 py-4">
          <Textarea
            value={urlText}
            onChange={(event) => setUrlText(event.target.value)}
            placeholder={limit === 1 ? "https://…" : "One URL per line"}
            rows={limit === 1 ? 3 : 6}
          />
          {urlError ? <p className="text-sm text-destructive">{urlError}</p> : null}
          <div className="space-y-2">
            {parsedUrls.map((url, index) =>
              url ? (
                <div key={url} className="flex items-center gap-3 rounded-lg border p-2">
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    <MediaPreview url={url} label={url} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs">{url}</span>
                  <button
                    type="button"
                    aria-label="Remove URL"
                    className="text-destructive"
                    onClick={() => {
                      const lines = urlText.split(/\s+/).filter(Boolean);
                      lines.splice(index, 1);
                      setUrlText(lines.join("\n"));
                    }}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : null,
            )}
          </div>
        </TabsContent>
      </Tabs>
    </SideSheet>
  );
}
