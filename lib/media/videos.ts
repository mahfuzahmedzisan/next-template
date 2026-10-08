import "server-only";

import { authedRequest } from "@/lib/auth/api";
import { toBrowserMedia } from "@/lib/media/browser-urls";

import type { CreateVideoResult, VideoListResult, VideoRecord } from "@/lib/media/types";

export async function listAdminVideos(onSessionExpired: "redirect" | "throw" = "redirect") {
  const data = await authedRequest<VideoListResult>("get", "/admin/videos?per_page=50", undefined, {
    onSessionExpired,
  });
  return toBrowserMedia(data);
}

export async function createAdminVideo(body: {
  title: string;
  filename: string;
  size: number;
  mime: string;
}) {
  const data = await authedRequest<CreateVideoResult>("post", "/admin/videos", body, {
    onSessionExpired: "throw",
  });
  return toBrowserMedia(data);
}

export async function getAdminVideo(id: number) {
  const data = await authedRequest<{ video: VideoRecord }>("get", `/admin/videos/${id}`, undefined, {
    onSessionExpired: "throw",
  });
  return toBrowserMedia(data);
}

export async function updateAdminVideo(id: number, title: string) {
  const data = await authedRequest<{ video: VideoRecord }>(
    "patch",
    `/admin/videos/${id}`,
    { title },
    { onSessionExpired: "throw" },
  );
  return toBrowserMedia(data);
}

export function deleteAdminVideo(id: number) {
  return authedRequest<null>("delete", `/admin/videos/${id}`, undefined, {
    onSessionExpired: "throw",
  });
}
