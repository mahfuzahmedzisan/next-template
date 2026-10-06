"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

import { CircularProgress } from "@/components/file-upload/circular-progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cropToSquareImage } from "@/lib/avatar-crop";
import { uploadAvatarWithProgress } from "@/lib/auth/avatar-upload";

export function AvatarCropDialog({
  file,
  onClose,
  onUploaded,
}: {
  file: File;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "preparing" | "uploading" | "processing"
  >("idle");
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const busy = phase !== "idle";

  function resetUpload() {
    abortRef.current = null;
    setPhase("idle");
    setProgress(0);
  }

  async function save() {
    if (!area) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("preparing");
    setProgress(0);

    try {
      const blob = await cropToSquareImage(imageUrl, area);
      if (controller.signal.aborted) {
        resetUpload();
        return;
      }

      setPhase("uploading");
      await uploadAvatarWithProgress({
        file: blob,
        signal: controller.signal,
        onProgress: (percent) => {
          setProgress(percent);
          if (percent >= 100) setPhase("processing");
        },
      });
      toast.success("Avatar updated successfully.");
      resetUpload();
      onUploaded();
      onClose();
    } catch (error) {
      if (controller.signal.aborted) {
        resetUpload();
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Unable to upload avatar.",
      );
      resetUpload();
    }
  }

  const statusLabel =
    phase === "preparing"
      ? "Preparing…"
      : phase === "processing"
        ? "Processing…"
        : `Uploading ${progress}%`;

  const buttonLabel =
    phase === "preparing"
      ? "Preparing…"
      : phase === "uploading"
        ? "Uploading…"
        : phase === "processing"
          ? "Saving…"
          : "Save photo";

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!busy}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Position your photo</DialogTitle>
          <DialogDescription>
            Drag inside the circle and zoom until the part you want is centered.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 overflow-hidden rounded-xl bg-muted">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={0}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            style={{}}
            classes={{}}
          />
          {phase !== "idle" ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55">
              <CircularProgress
                value={progress}
                indeterminate={phase !== "uploading"}
                size={72}
              />
              <p className="text-xs font-medium text-white">{statusLabel}</p>
              {phase === "preparing" || phase === "uploading" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => abortRef.current?.abort()}
                >
                  Cancel upload
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <label className="grid gap-2 text-xs text-muted-foreground">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={busy}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-foreground"
            aria-label="Zoom"
          />
        </label>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !area}
            onClick={() => void save()}
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
