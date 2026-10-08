import { redirect } from "next/navigation";

import { MediaLibrary } from "@/components/admin/media/media-library";
import { RouteReady } from "@/components/transitions/route-ready";
import { ApiError } from "@/lib/auth/api-error";
import { getSession } from "@/lib/auth/auth-cookies";
import { listAdminVideos } from "@/lib/media/videos";
import type { VideoRecord } from "@/lib/media/types";

export default async function MediaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let videos: VideoRecord[] = [];
  let loadError: string | null = null;

  try {
    videos = (await listAdminVideos()).videos;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    loadError = error.message;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <RouteReady />
      <div>
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          Media
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Upload a video, pause or resume the transfer, then play the adaptive
          stream. The original file is never the playback source.
        </p>
      </div>
      <MediaLibrary
        userId={session.user.id}
        initialVideos={videos}
        loadError={loadError}
      />
    </div>
  );
}
