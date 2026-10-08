"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { VideoPlayer } from "@/components/media/video-player";
import { Button } from "@/components/ui/button";
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media";
import { createVideoUpload, type TusUploadHandle } from "@/lib/media/tus-upload";
import type { VideoRecord } from "@/lib/media/types";
import { getEcho } from "@/lib/realtime/echo";

type Row = VideoRecord & {
  uploadPercent: number | null;
  uploadError: string | null;
  paused: boolean;
};

type ProcessingPayload = {
  video_id?: number;
  status?: VideoRecord["status"];
  progress?: number;
  stream_url?: string | null;
  error_message?: string | null;
};

function announceEncode(
  toasted: Set<string>,
  video: { id: number; status: VideoRecord["status"]; title: string; error_message: string | null },
) {
  if (video.status !== "ready" && video.status !== "failed") return;
  const key = `${video.id}:${video.status}`;
  if (toasted.has(key)) return;
  toasted.add(key);
  if (video.status === "ready") {
    toast.success("Video is ready to stream", { description: video.title });
    return;
  }
  toast.error("Video encoding failed", {
    description: video.error_message ?? video.title,
  });
}

function statusLabel(status: VideoRecord["status"]) {
  switch (status) {
    case "awaiting_upload":
      return "Uploading";
    case "uploaded":
      return "Queued";
    case "processing":
      return "Encoding";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
  }
}

export function MediaLibrary({
  userId,
  initialVideos,
  loadError,
}: {
  userId: string | number;
  initialVideos: VideoRecord[];
  loadError: string | null;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialVideos.map((video) => ({
      ...video,
      uploadPercent: null,
      uploadError: null,
      paused: false,
    })),
  );
  const [busy, setBusy] = useState(false);
  const uploads = useRef(new Map<number, TusUploadHandle>());
  const rowsRef = useRef(rows);
  const toasted = useRef(
    new Set(
      initialVideos
        .filter((video) => video.status === "ready" || video.status === "failed")
        .map((video) => `${video.id}:${video.status}`),
    ),
  );
  const needsPoll = rows.some(
    (row) => row.status === "uploaded" || row.status === "processing",
  );

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  function mergeVideo(video: VideoRecord) {
    setRows((current) => {
      const next = current.map((row) =>
        row.id === video.id
          ? {
              ...row,
              ...video,
              uploadPercent: video.status === "awaiting_upload" ? row.uploadPercent : null,
            }
          : row,
      );
      return next.some((row) => row.id === video.id)
        ? next
        : [{ ...video, uploadPercent: null, uploadError: null, paused: false }, ...next];
    });
    announceEncode(toasted.current, video);
  }

  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`App.Models.User.${userId}`);
    channel.listen(".video.processing", (payload: unknown) => {
      const data = (payload ?? {}) as ProcessingPayload;
      if (!data.video_id || !data.status) return;

      const existing = rowsRef.current.find((row) => row.id === data.video_id);
      const status = data.status;
      setRows((current) =>
        current.map((row) => {
          if (row.id !== data.video_id) return row;
          return {
            ...row,
            status,
            progress: data.progress ?? row.progress,
            stream_url: toSameOriginStorageUrl(data.stream_url) ?? row.stream_url,
            error_message: data.error_message ?? row.error_message,
          };
        }),
      );
      announceEncode(toasted.current, {
        id: data.video_id,
        status,
        title: existing?.title ?? "Video",
        error_message: data.error_message ?? existing?.error_message ?? null,
      });
    });

    return () => {
      echo.leave(`private-App.Models.User.${userId}`);
    };
  }, [userId]);

  useEffect(() => {
    if (!needsPoll) return;

    const timer = window.setInterval(() => {
      void fetch("/api/admin/videos", { credentials: "include" })
        .then(async (response) => {
          if (!response.ok) return;
          const body = (await response.json()) as { data?: { videos?: VideoRecord[] } };
          const videos = body.data?.videos ?? [];
          setRows((current) =>
            current.map((row) => {
              const video = videos.find((item) => item.id === row.id);
              if (!video) return row;
              return {
                ...row,
                ...video,
                uploadPercent: video.status === "awaiting_upload" ? row.uploadPercent : null,
              };
            }),
          );
          for (const video of videos) {
            announceEncode(toasted.current, video);
          }
        })
        .catch(() => undefined);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [needsPoll]);

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);

    for (const file of Array.from(list)) {
      const title = file.name.replace(/\.[^.]+$/, "") || file.name;
      try {
        const response = await fetch("/api/admin/videos", {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            filename: file.name,
            size: file.size,
            mime: file.type || "video/mp4",
          }),
        });
        const body = (await response.json()) as {
          message?: string;
          data?: {
            video_id: number;
            tus_endpoint: string;
            upload_token: string;
            video: VideoRecord;
          };
        };
        if (!response.ok || !body.data) {
          toast.error(body.message ?? "Unable to start the upload.");
          continue;
        }

        const created = body.data;
        setRows((current) => [
          {
            ...created.video,
            uploadPercent: 0,
            uploadError: null,
            paused: false,
          },
          ...current.filter((row) => row.id !== created.video.id),
        ]);

        const handle = createVideoUpload({
          file,
          endpoint: created.tus_endpoint,
          token: created.upload_token,
          videoId: created.video_id,
          onProgress(percent) {
            setRows((current) =>
              current.map((row) =>
                row.id === created.video_id ? { ...row, uploadPercent: percent, paused: false } : row,
              ),
            );
          },
          onSuccess() {
            void fetch(`/api/admin/videos/${created.video_id}`, { credentials: "include" })
              .then(async (result) => {
                if (!result.ok) return;
                const payload = (await result.json()) as { data?: { video?: VideoRecord } };
                if (payload.data?.video) mergeVideo(payload.data.video);
              })
              .catch(() => undefined);
          },
          onError(error) {
            setRows((current) =>
              current.map((row) =>
                row.id === created.video_id
                  ? { ...row, uploadError: error.message, paused: true }
                  : row,
              ),
            );
            toast.error("Upload paused", { description: error.message });
          },
        });
        uploads.current.set(created.video_id, handle);
        handle.start();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to start the upload.");
      }
    }

    setBusy(false);
  }

  async function onDelete(id: number) {
    const response = await fetch(`/api/admin/videos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      toast.error(body.message ?? "Unable to delete the video.");
      return;
    }
    uploads.current.get(id)?.pause();
    uploads.current.delete(id);
    setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
        <span className="text-sm font-medium">Choose videos</span>
        <span className="text-sm text-muted-foreground">
          mp4, webm, mov, mkv, or avi. Upload can be paused and resumed.
        </span>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mkv,.avi,.m4v"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void onFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <ul className="flex flex-col gap-4">
        {rows.map((row) => {
          const uploadPercent = row.uploadPercent;
          const showUpload = row.status === "awaiting_upload" && uploadPercent !== null;
          return (
            <li key={row.id} className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {statusLabel(row.status)}
                    {showUpload ? ` · ${uploadPercent}%` : null}
                    {row.status === "processing" ? ` · ${row.progress}%` : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {showUpload ? (
                    row.paused ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => uploads.current.get(row.id)?.resume()}
                      >
                        Resume
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          uploads.current.get(row.id)?.pause();
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id ? { ...item, paused: true } : item,
                            ),
                          );
                        }}
                      >
                        Pause
                      </Button>
                    )
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => void onDelete(row.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              {showUpload ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              ) : null}

              {row.uploadError ? (
                <p className="text-sm text-destructive">{row.uploadError}</p>
              ) : null}
              {row.status === "failed" && row.error_message ? (
                <p className="text-sm text-destructive">{row.error_message}</p>
              ) : null}

              {row.status === "ready" && row.stream_url ? (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <VideoPlayer
                    src={row.stream_url}
                    type="hls"
                    poster={row.poster_url ?? undefined}
                  />
                </div>
              ) : row.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- poster is an API storage URL, not a local asset
                <img
                  src={toSameOriginStorageUrl(row.poster_url) ?? row.poster_url}
                  alt=""
                  className="aspect-video w-full rounded-lg object-cover"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
