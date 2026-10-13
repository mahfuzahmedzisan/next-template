import "server-only";

import { authedRequest } from "@/lib/auth/api";
import { toBrowserMedia } from "@/lib/media/browser-urls";
import type { CreateMediaResult, MediaListResult, MediaRecord } from "@/lib/media/types";

export async function listAdminMedia(
  query = "",
  onSessionExpired: "redirect" | "throw" = "redirect",
) {
  const path = query ? `/admin/media?${query}` : "/admin/media?per_page=50";
  const data = await authedRequest<MediaListResult>("get", path, undefined, {
    onSessionExpired,
  });
  return toBrowserMedia(data);
}

export async function previewAdminMediaSlugs(title: string, count: number, except?: number) {
  const params = new URLSearchParams({
    title,
    count: String(count),
  });
  if (except) params.set("except", String(except));
  const data = await authedRequest<{ slugs: string[] }>(
    "get",
    `/admin/media/slug-preview?${params.toString()}`,
    undefined,
    { onSessionExpired: "throw" },
  );
  return data.slugs;
}

export async function createAdminMedia(body: {
  title: string;
  slug?: string;
  filename: string;
  size: number;
  mime: string;
  alt?: string;
  keywords?: string[];
}) {
  const data = await authedRequest<CreateMediaResult>("post", "/admin/media", body, {
    onSessionExpired: "throw",
  });
  return toBrowserMedia(data);
}

export async function getAdminMedia(id: number) {
  const data = await authedRequest<{ media: MediaRecord }>("get", `/admin/media/${id}`, undefined, {
    onSessionExpired: "throw",
  });
  return toBrowserMedia(data);
}

export async function updateAdminMedia(
  id: number,
  body: { title: string; slug: string; alt?: string | null; keywords?: string[] },
) {
  const data = await authedRequest<{ media: MediaRecord }>("patch", `/admin/media/${id}`, body, {
    onSessionExpired: "throw",
  });
  return toBrowserMedia(data);
}

export function deleteAdminMedia(id: number) {
  return authedRequest<null>("delete", `/admin/media/${id}`, undefined, {
    onSessionExpired: "throw",
  });
}

export async function resumeAdminMediaUpload(id: number) {
  const data = await authedRequest<{
    media_id: number;
    tus_endpoint: string;
    upload_token: string;
  }>("post", `/admin/media/${id}/resume`, {}, { onSessionExpired: "throw" });
  return toBrowserMedia(data);
}

export async function retryAdminMedia(id: number) {
  const data = await authedRequest<{ media: MediaRecord }>(
    "post",
    `/admin/media/${id}/retry`,
    {},
    { onSessionExpired: "throw" },
  );
  return toBrowserMedia(data);
}

export async function uploadAdminMediaThumbnail(id: number, thumbnail: File) {
  const body = new FormData();
  body.append("thumbnail", thumbnail);
  const data = await authedRequest<{ media: MediaRecord }>(
    "post",
    `/admin/media/${id}/thumbnail`,
    body,
    { onSessionExpired: "throw" },
  );
  return toBrowserMedia(data);
}
