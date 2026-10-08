"use client"

import type { CSSProperties } from "react"
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video"
import { Video, VideoPlayer as VideoJsPlayer } from "@videojs/react/video"

import { VideoSkin } from "@/components/videojs/video/skin"
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media"
import { cn } from "@/lib/utils"

type VideoPlayerProps = {
  src: string
  type?: string
  poster?: string
  className?: string
  controls?: boolean
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  fluid?: boolean
}

function isHls(src: string, type?: string) {
  if (
    type === "hls" ||
    type === "application/x-mpegURL" ||
    type === "application/vnd.apple.mpegurl"
  ) {
    return true
  }

  const path = src.split("?")[0]?.split("#")[0] ?? src
  return path.endsWith(".m3u8")
}

/**
 * Video.js 10 player. The default skin owns the controls, so the media
 * element does not set the native `controls` attribute.
 */
export function VideoPlayer({
  src,
  type = "video/mp4",
  poster,
  className,
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  fluid = true,
}: VideoPlayerProps) {
  const playbackSrc = toSameOriginStorageUrl(src) ?? src
  const playbackPoster = toSameOriginStorageUrl(poster) ?? undefined
  const hls = isHls(playbackSrc, type)
  const mediaProps = {
    src: playbackSrc,
    autoPlay: autoplay,
    muted,
    loop,
    playsInline: true,
    className: "size-full object-contain",
  }

  const media = hls ? <HlsJsVideo {...mediaProps} /> : <Video {...mediaProps} />

  return (
    <div
      className={cn("overflow-hidden bg-black", fluid ? "aspect-video w-full" : "size-full", className)}
    >
      <VideoJsPlayer poster={playbackPoster}>
        {controls ? (
          <VideoSkin
            className="size-full"
            style={{ "--media-video-border-radius": "0px" } as CSSProperties}
          >
            {media}
          </VideoSkin>
        ) : (
          media
        )}
      </VideoJsPlayer>
    </div>
  )
}
