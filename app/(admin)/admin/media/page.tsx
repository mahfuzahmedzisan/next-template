import { Suspense } from "react";
import { redirect } from "next/navigation";

import { MediaLibrary } from "@/components/admin/media/media-library";
import { RouteReady } from "@/components/transitions/route-ready";
import { ApiError } from "@/lib/auth/api-error";
import { getSession } from "@/lib/auth/auth-cookies";
import { listAdminMedia } from "@/lib/media/library";
import type { MediaRecord, MediaTypeFilter } from "@/lib/media/types";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const query = new URLSearchParams({ per_page: "50" });
  if (params.q?.trim()) query.set("filter[q]", params.q.trim());
  const kind = params.kind as MediaTypeFilter | undefined;
  if (kind && kind !== "all") query.set("filter[kind]", kind);

  let media: MediaRecord[] = [];
  let loadError: string | null = null;

  try {
    media = (await listAdminMedia(query.toString())).media;
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
          Images, video, audio, PDFs, and documents. Video and audio play as a
          stream. The original upload is removed once that stream is ready.
        </p>
      </div>
      <Suspense>
        <MediaLibrary userId={session.user.id} initialMedia={media} loadError={loadError} />
      </Suspense>
    </div>
  );
}
