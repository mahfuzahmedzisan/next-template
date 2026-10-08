"use client"

import { useEffect, useRef } from "react"
import videojs from "video.js"
import type Player from "video.js/dist/types/player"

import { cn } from "@/lib/utils"

import "video.js/dist/video-js.css"

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

function playbackType(src: string, type?: string) {
  if (
    type === "hls" ||
    type === "application/x-mpegURL" ||
    type === "application/vnd.apple.mpegurl"
  ) {
    return "application/x-mpegURL"
  }

  const path = src.split("?")[0]?.split("#")[0] ?? src
  if (path.endsWith(".m3u8")) {
    return "application/x-mpegURL"
  }

  return type ?? "video/mp4"
}

/**
 * Video.js player for Next.js App Router (client-only).
 * Apache-2.0 licensed — replaces native HTML5 video chrome.
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
  const sourceType = playbackType(src, type)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const videoElement = document.createElement("video-js")
    videoElement.classList.add("vjs-big-play-centered", "vjs-fill")
    container.appendChild(videoElement)

    const player = videojs(videoElement, {
      controls,
      autoplay,
      muted,
      loop,
      preload: "metadata",
      fluid,
      responsive: true,
      playsinline: true,
      poster,
      sources: [{ src, type: sourceType }],
      controlBar: {
        pictureInPictureToggle: true,
        volumePanel: { inline: false },
      },
    })

    playerRef.current = player

    return () => {
      const current = playerRef.current
      if (current && !current.isDisposed()) {
        current.dispose()
      }
      playerRef.current = null
    }
    // Mount once; source updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only init
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player || player.isDisposed()) return

    player.src({ src, type: sourceType })
    if (poster) player.poster(poster)
  }, [poster, sourceType, src])

  useEffect(() => {
    const player = playerRef.current
    if (!player || player.isDisposed()) return
    player.muted(muted)
  }, [muted])

  return (
    <div
      data-vjs-player
      className={cn("size-full overflow-hidden bg-black [&_.video-js]:size-full", className)}
    >
      <div ref={containerRef} className="size-full" />
    </div>
  )
}
