"use client"

import { VideoPlayer } from "@/components/media/video-player"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type VideoPlayerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string
  type?: string
  title?: string
}

export function VideoPlayerDialog({
  open,
  onOpenChange,
  src,
  type = "video/mp4",
  title = "Video preview",
}: VideoPlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Video.js player preview</DialogDescription>
        </DialogHeader>
        {open ? (
          <div className="aspect-video w-full bg-black">
            <VideoPlayer src={src} type={type} autoplay fluid />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
