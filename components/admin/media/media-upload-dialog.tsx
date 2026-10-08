"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCEPT = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".mp4", ".mov", ".webm", ".mkv",
  ".mp3", ".wav", ".m4a", ".ogg",
  ".pdf", ".txt", ".csv", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
].join(",");

export type ThumbnailMode = "shared" | "individual";

export type UploadRequest = {
  files: File[];
  alt: string;
  keywords: string[];
  thumbnailMode: ThumbnailMode;
  sharedThumbnail: File | null;
  thumbnails: Record<string, File | null>;
};

function needsThumbnail(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["mp4", "mov", "webm", "mkv", "mp3", "wav", "m4a", "ogg"].includes(extension);
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onSubmit: (request: UploadRequest) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [alt, setAlt] = useState("");
  const [keywords, setKeywords] = useState("");
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailMode>("shared");
  const [sharedThumbnail, setSharedThumbnail] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, File | null>>({});

  const streamable = useMemo(() => files.filter(needsThumbnail), [files]);

  function reset() {
    setFiles([]);
    setAlt("");
    setKeywords("");
    setThumbnailMode("shared");
    setSharedThumbnail(null);
    setThumbnails({});
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload media</DialogTitle>
          <DialogDescription>
            Images, video, audio, PDFs, and documents. Scripts, archives, and
            disguised executables are rejected. Video and audio become a stream,
            then the original file is removed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="media-files">Files</Label>
            <Input
              id="media-files"
              type="file"
              accept={ACCEPT}
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="media-alt">Alt text</Label>
            <Input
              id="media-alt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Describe the file for search and accessibility"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="media-keywords">Keywords</Label>
            <Input
              id="media-keywords"
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              placeholder="interview, launch, 2026"
            />
          </div>

          {streamable.length > 0 ? (
            <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">Thumbnail</legend>
              <p className="text-sm text-muted-foreground">
                Optional. One cover for the whole batch is the recommended choice.
                Video still gets a frame from the encode when you skip this.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="thumbnail-mode"
                  checked={thumbnailMode === "shared"}
                  onChange={() => setThumbnailMode("shared")}
                />
                One thumbnail for every audio and video file
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="thumbnail-mode"
                  checked={thumbnailMode === "individual"}
                  onChange={() => setThumbnailMode("individual")}
                />
                A separate thumbnail for each file
              </label>
              {thumbnailMode === "shared" ? (
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => setSharedThumbnail(event.target.files?.[0] ?? null)}
                />
              ) : (
                streamable.map((file) => (
                  <label key={file.name + file.size} className="flex flex-col gap-1 text-sm">
                    <span className="truncate text-muted-foreground">{file.name}</span>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) =>
                        setThumbnails((current) => ({
                          ...current,
                          [`${file.name}:${file.size}`]: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                ))
              )}
            </fieldset>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || files.length === 0}
            onClick={() =>
              onSubmit({
                files,
                alt: alt.trim(),
                keywords: keywords
                  .split(",")
                  .map((keyword) => keyword.trim())
                  .filter(Boolean),
                thumbnailMode,
                sharedThumbnail,
                thumbnails,
              })
            }
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function thumbnailFor(file: File, request: UploadRequest) {
  if (!needsThumbnail(file)) return null;
  if (request.thumbnailMode === "shared") return request.sharedThumbnail;
  return request.thumbnails[`${file.name}:${file.size}`] ?? null;
}
