"use client"

import { useEffect, useRef } from "react"
import videojs from "video.js"
import type Player from "video.js/dist/types/player"

import { registerQualityMenu } from "@/components/media/quality-menu"
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media"
import { cn } from "@/lib/utils"

import "video.js/dist/video-js.css"
import "./video-player.css"

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
  const playbackSrc = toSameOriginStorageUrl(src) ?? src
  const playbackPoster = toSameOriginStorageUrl(poster) ?? undefined
  const sourceType = playbackType(playbackSrc, type)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const videoElement = document.createElement("video-js")
    videoElement.classList.add("vjs-big-play-centered", "vjs-fill")
    container.appendChild(videoElement)

    registerQualityMenu()

    const player = videojs(videoElement, {
      controls,
      autoplay,
      muted,
      loop,
      preload: "metadata",
      fluid,
      responsive: true,
      playsinline: true,
      poster: playbackPoster,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      sources: [{ src: playbackSrc, type: sourceType }],
      html5: {
        vhs: {
          overrideNative: true,
        },
      },
      userActions: {
        hotkeys(this: Player, event: KeyboardEvent) {
          const key = event.key.toLowerCase()
          if (key === "arrowleft" || key === "j") {
            event.preventDefault()
            this.currentTime(Math.max(0, (this.currentTime() ?? 0) - 10))
            return
          }
          if (key === "arrowright" || key === "l") {
            event.preventDefault()
            const duration = this.duration() ?? Number.NaN
            const next = (this.currentTime() ?? 0) + 10
            this.currentTime(Number.isFinite(duration) ? Math.min(duration, next) : next)
            return
          }
          ;(this as Player & { handleHotkeys: (event: Event) => void }).handleHotkeys(event)
        },
      },
      controlBar: {
        pictureInPictureToggle: true,
        volumePanel: { inline: false },
        skipButtons: { backward: 10, forward: 10 },
        children: [
          "playToggle",
          "skipBackward",
          "skipForward",
          "volumePanel",
          "currentTimeDisplay",
          "timeDivider",
          "durationDisplay",
          "progressControl",
          "remainingTimeDisplay",
          "customControlSpacer",
          "playbackRateMenuButton",
          "QualityMenuButton",
          "pictureInPictureToggle",
          "fullscreenToggle",
        ],
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

    player.src({ src: playbackSrc, type: sourceType })
    if (playbackPoster) player.poster(playbackPoster)
  }, [playbackPoster, playbackSrc, sourceType])

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
