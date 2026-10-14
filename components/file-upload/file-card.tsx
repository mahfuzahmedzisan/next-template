"use client"

import Image from "next/image"
import { CheckCircle2, X } from "lucide-react"
import { createElement, useEffect, useState } from "react"

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Badge } from "@/components/ui/badge"
import { VideoPlayer } from "@/components/media/video-player"
import { cn } from "cn"

import { formatBytes, resolveExtLabel, resolveIcon } from "@/lib/file-upload"
import type { FileUploadClassNames } from "@/types/file-upload"

import { CircularProgress } from "./circular-progress"

interface FileCardProps {
  name: string
  size?: number
  preview: string
  type: "image" | "video" | "other"
  mime: string
  onPreview?: () => void
  onRemove?: () => void
  onCancel?: () => void
  progress?: number
  loading?: boolean
  compact?: boolean
  fixedSize?: number
  classNames?: Pick<FileUploadClassNames, "card" | "cardMedia" | "cardInfo" | "removeButton" | "progressOverlay">
}

export function FileCard({
  name,
  size,
  preview,
  type,
  mime,
  onPreview,
  onRemove,
  onCancel,
  progress,
  loading = false,
  compact = false,
  fixedSize,
  classNames = {},
}: FileCardProps) {
  const ext = resolveExtLabel(mime)
  const isUploading = loading || (progress !== undefined && progress < 100)
  const isDone = progress !== undefined && progress >= 100
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    if (!isDone) {
      const timer = window.setTimeout(() => setShowCheck(false), 0)
      return () => clearTimeout(timer)
    }

    const showTimer = window.setTimeout(() => setShowCheck(true), 0)
    const hideTimer = window.setTimeout(() => setShowCheck(false), 2000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [isDone])

  const media =
    type === "image" && preview ? (
      <Image
        src={preview}
        alt={name}
        fill
        unoptimized
        draggable={false}
        sizes="(max-width: 640px) 50vw, 200px"
        className="object-cover"
      />
    ) : type === "video" && preview ? (
      <VideoPlayer
        src={preview}
        type={mime || "video/mp4"}
        muted
        controls
        fluid={false}
        className="absolute inset-0"
      />
    ) : (
      <div className="pointer-events-none flex flex-col items-center gap-1">
        {createElement(resolveIcon(mime), { className: "size-7 text-muted-foreground" })}
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {ext}
        </Badge>
      </div>
    )

  return (
    <Attachment
      data-file-card
      orientation={compact ? "horizontal" : "vertical"}
      state={isUploading ? "uploading" : "done"}
      className={cn(
        "group relative overflow-visible rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md",
        compact ? "size-full rounded-full" : "w-full",
        classNames.card
      )}
      style={fixedSize ? { width: fixedSize, height: fixedSize } : undefined}
    >
      <button
        type="button"
        onClick={onPreview}
        disabled={!onPreview}
        className={cn(
          "absolute inset-0 z-10 cursor-default rounded-[inherit] outline-none",
          onPreview && "cursor-zoom-in focus-visible:ring-2 focus-visible:ring-primary"
        )}
        aria-label={onPreview ? `Preview ${name}` : undefined}
      />
      <AttachmentMedia
        variant={type === "other" ? "icon" : "image"}
        className={cn(
          "relative overflow-hidden",
          compact ? "size-full rounded-[inherit]" : "aspect-video w-full rounded-t-[inherit] rounded-b-none",
          classNames.cardMedia
        )}
      >
        {media}
      </AttachmentMedia>
      {!compact && (
        <AttachmentContent className={cn("w-full px-2.5 py-2", classNames.cardInfo)}>
          <AttachmentTitle title={name} className="text-xs">
            {name}
          </AttachmentTitle>
          <AttachmentDescription className="flex items-center justify-between gap-1 text-[11px]">
            <span>{size !== undefined ? formatBytes(size) : ""}</span>
            <Badge variant="outline" className="h-[18px] shrink-0 px-1 py-0 text-[9px]">
              {ext}
            </Badge>
          </AttachmentDescription>
        </AttachmentContent>
      )}
      {isUploading && (
        <div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-black/60 backdrop-blur-[2px]",
            classNames.progressOverlay
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <CircularProgress value={progress ?? 0} indeterminate={loading && progress === undefined} size={46} />
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-[11px] font-medium text-white/90 underline underline-offset-2 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {showCheck && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-green-900/40">
          <CheckCircle2 className="size-9 text-white drop-shadow-md" />
        </div>
      )}
      {onRemove && !isUploading && (
        <AttachmentActions
          className={cn(
            "absolute top-1.5 right-1.5 z-30",
            compact ? "top-0.5 right-0.5" : "opacity-0 transition-opacity group-hover:opacity-100",
            classNames.removeButton
          )}
        >
          <AttachmentAction
            type="button"
            variant="destructive"
            onClick={onRemove}
            aria-label={`Remove ${name}`}
            className="shadow-md"
          >
            <X />
          </AttachmentAction>
        </AttachmentActions>
      )}
    </Attachment>
  )
}
