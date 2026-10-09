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

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitUntilReady(id: number): Promise<MediaRecord> {
  const started = Date.now();

  while (Date.now() - started < 120_000) {
    const response = await fetch(`/api/admin/media/${id}`, { credentials: "include" });
    const body = await readJson<{ data?: { media?: MediaRecord }; message?: string }>(response);
    const media = body.data?.media;
    if (!response.ok || !media) {
      throw new Error(body.message ?? "Unable to read the upload.");
    }
    if (media.status === "ready" && (media.url || media.stream_url)) return media;
    if (media.status === "failed") {
      throw new Error(media.error_message ?? "Conversion failed.");
    }
    await wait(1500);
  }

  throw new Error("Conversion is taking too long.");
}

export async function uploadMediaFile(
  file: File,
  onProgress: (phase: UploadPhase, percent: number) => void,
): Promise<MediaRecord> {
  const mime = mimeFor(file);
  if (!mime) throw new Error("This file type is not allowed.");

  onProgress("uploading", 0);
  const response = await fetch("/api/admin/media", {
    method: "POST",
    credentials: "include",
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
    const handle = createMediaUpload({
      file,
      endpoint: created.tus_endpoint,
      token: created.upload_token,
      mediaId: created.media_id,
      onProgress(percent) {
        onProgress("uploading", percent);
      },
      onSuccess() {
        resolve();
      },
      onError(error) {
        reject(error);
      },
    });
    handle.start();
  });

  onProgress("converting", 100);
  return waitUntilReady(created.media_id);
}
