import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media";

const BLOCKED_SCHEME = /^(javascript|data|file|vbscript|blob):/i;

function relativeStoragePath(value: string): string | null {
  let path = value.trim();
  if (path.startsWith("/api/storage/")) path = path.slice("/api/storage/".length);
  path = path.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!path || path.includes("..") || path.includes("://") || path.includes("\0")) return null;
  return path;
}

/** Absolute http(s) stays. A storage path becomes `/api/storage/...`. Unsafe schemes are dropped. */
export function formatMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || BLOCKED_SCHEME.test(trimmed)) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.username || url.password) return null;
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return toSameOriginStorageUrl(url.toString());
    } catch {
      return null;
    }
  }

  const relative = relativeStoragePath(trimmed);
  if (!relative) return null;
  return `/api/storage/${relative}`;
}

export function formatMediaUrls(values: readonly string[]): string[] {
  return values.flatMap((value) => {
    const formatted = formatMediaUrl(value);
    return formatted ? [formatted] : [];
  });
}
