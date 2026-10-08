import "server-only";

import { authedRequest } from "@/lib/auth/api";

import type { CreateVideoResult, VideoListResult, VideoRecord } from "@/lib/media/types";

export function listAdminVideos(onSessionExpired: "redirect" | "throw" = "redirect") {
  return authedRequest<VideoListResult>("get", "/admin/videos?per_page=50", undefined, {
    onSessionExpired,
  });
}

export function createAdminVideo(body: {
  title: string;
  filename: string;
  size: number;
  mime: string;
}) {
  return authedRequest<CreateVideoResult>("post", "/admin/videos", body, {
    onSessionExpired: "throw",
  });
}

export function getAdminVideo(id: number) {
  return authedRequest<{ video: VideoRecord }>("get", `/admin/videos/${id}`, undefined, {
    onSessionExpired: "throw",
  });
}

export function updateAdminVideo(id: number, title: string) {
  return authedRequest<{ video: VideoRecord }>(
    "patch",
    `/admin/videos/${id}`,
    { title },
    { onSessionExpired: "throw" },
  );
}

export function deleteAdminVideo(id: number) {
  return authedRequest<null>("delete", `/admin/videos/${id}`, undefined, {
    onSessionExpired: "throw",
  });
}
