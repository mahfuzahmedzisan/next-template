import { createMediaUpload } from "@/lib/media/tus-upload";
import type { MediaRecord } from "@/lib/media/types";

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

export type UploadPhase = "uploading" | "converting";

function mimeFor(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? file.type;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function abortError() {
  return new DOMException("The upload was cancelled.", "AbortError");
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      window.clearTimeout(timer);
      reject(abortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Video conversion can take far longer than an image; callers pick the wait. */
const DEFAULT_READY_TIMEOUT_MS = 120_000;

async function waitUntilReady(id: number, timeoutMs: number, signal?: AbortSignal): Promise<MediaRecord> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const response = await fetch(`/api/admin/media/${id}`, { credentials: "include", signal });
    const body = await readJson<{ data?: { media?: MediaRecord }; message?: string }>(response);
    const media = body.data?.media;
    if (!response.ok || !media) {
      throw new Error(body.message ?? "Unable to read the upload.");
    }
    if (media.status === "ready" && (media.url || media.stream_url)) return media;
    if (media.status === "failed") {
      throw new Error(media.error_message ?? "Conversion failed.");
    }
    await wait(1500, signal);
  }

  throw new Error("Conversion is taking too long.");
}

export async function uploadMediaFile(
  file: File,
  onProgress: (phase: UploadPhase, percent: number) => void,
  options: { signal?: AbortSignal; readyTimeoutMs?: number } = {},
): Promise<MediaRecord> {
  const { signal, readyTimeoutMs = DEFAULT_READY_TIMEOUT_MS } = options;
  const mime = mimeFor(file);
  if (!mime) throw new Error("This file type is not allowed.");
  if (signal?.aborted) throw abortError();

  onProgress("uploading", 0);
  const response = await fetch("/api/admin/media", {
    method: "POST",
    credentials: "include",
    signal,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      title: file.name.replace(/\.[^.]+$/, "") || file.name,
      filename: file.name,
      size: file.size,
      mime,
    }),
  });
  const body = await readJson<{
    message?: string;
    data?: { media_id: number; tus_endpoint: string; upload_token: string };
  }>(response);
  if (!response.ok || !body.data) {
    throw new Error(body.message ?? "Unable to start the upload.");
  }

  const created = body.data;
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      handle.pause();
      reject(abortError());
    };
    const handle = createMediaUpload({
      file,
      endpoint: created.tus_endpoint,
      token: created.upload_token,
      mediaId: created.media_id,
      onProgress(percent) {
        onProgress("uploading", percent);
      },
      onSuccess() {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      },
      onError(error) {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
    });
    signal?.addEventListener("abort", onAbort, { once: true });
    handle.start();
  });

  onProgress("converting", 100);
  return waitUntilReady(created.media_id, readyTimeoutMs, signal);
}
