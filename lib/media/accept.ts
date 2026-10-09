import { formatMediaUrl } from "@/lib/media/media-url";
import type { MediaKind } from "@/lib/media/types";

export const MEDIA_UPLOAD_MAX = 10;

const ACCEPT: Record<MediaKind, { accept: string; extensions: string[] }> = {
  image: {
    accept: "image/*,.svg,.jpg,.jpeg,.png,.gif,.webp,.ico",
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"],
  },
  video: {
    accept: "video/*,.mp4,.mov,.webm,.mkv",
    extensions: ["mp4", "mov", "webm", "mkv"],
  },
  audio: {
    accept: "audio/*,.mp3,.wav,.m4a,.ogg",
    extensions: ["mp3", "wav", "m4a", "ogg"],
  },
  pdf: {
    accept: "application/pdf,.pdf",
    extensions: ["pdf"],
  },
  document: {
    accept: ".txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
    extensions: ["txt", "csv", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
  },
};

const ALL_KINDS = Object.keys(ACCEPT) as MediaKind[];

export function clampMediaMax(max: number) {
  if (!Number.isFinite(max) || max < 1) return 1;
  return Math.min(Math.floor(max), MEDIA_UPLOAD_MAX);
}

export function acceptFor(kinds: readonly MediaKind[]) {
  const list = kinds.length > 0 ? kinds : ALL_KINDS;
  return {
    accept: list.map((kind) => ACCEPT[kind].accept).join(","),
    extensions: list.flatMap((kind) => ACCEPT[kind].extensions),
  };
}

export function extensionOf(url: string) {
  const path = url.split(/[?#]/)[0] ?? url;
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function allowedMediaUrl(value: string, kinds: readonly MediaKind[]) {
  const formatted = formatMediaUrl(value);
  if (!formatted) return null;
  const extension = extensionOf(formatted);
  if (!acceptFor(kinds).extensions.includes(extension)) return null;
  return formatted;
}
