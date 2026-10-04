"use client"

import Lightbox from "yet-another-react-lightbox"
import Video from "yet-another-react-lightbox/plugins/video"
import Zoom from "yet-another-react-lightbox/plugins/zoom"

import "yet-another-react-lightbox/styles.css"

type LightboxSlide =
  | { src: string; alt?: string }
  | { type: "video"; sources: Array<{ src: string; type: string }> }

interface FileUploadLightboxProps {
  open: boolean
  close: () => void
  slides: LightboxSlide[]
  index: number
}

export function FileUploadLightbox({ open, close, slides, index }: FileUploadLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={close}
      slides={slides}
      index={index}
      plugins={[Zoom, Video]}
      zoom={{ maxZoomPixelRatio: 4 }}
    />
  )
}
