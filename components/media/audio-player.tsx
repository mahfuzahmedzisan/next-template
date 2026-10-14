"use client"

import { Audio, AudioPlayer as VideoJsAudioPlayer } from "@videojs/react/audio"

import { AudioSkin } from "@/components/videojs/audio/skin"
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media"
import { cn } from "cn"

type AudioPlayerProps = {
  src: string
  label?: string
  className?: string
  autoplay?: boolean
}

/**
 * Video.js 10 audio player. The default skin owns the controls, so the media
 * element does not set the native `controls` attribute.
 */
export function AudioPlayer({ src, label, className, autoplay = false }: AudioPlayerProps) {
  const playbackSrc = toSameOriginStorageUrl(src) ?? src

  return (
    <VideoJsAudioPlayer>
      <AudioSkin className={cn("w-full", className)} aria-label={label}>
        <Audio src={playbackSrc} autoPlay={autoplay} preload="metadata" />
      </AudioSkin>
    </VideoJsAudioPlayer>
  )
}
