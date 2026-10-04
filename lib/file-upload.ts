import { File as FileIcon, FileImage, FileText, FileVideo } from "lucide-react"
import type { ElementType } from "react"

import type { FilePreview } from "@/types/file-upload"

export const BYTES_PER_MB = 1_048_576

type IconComponent = ElementType<{ className?: string }>

const MIME_ICONS: Record<string, IconComponent> = {
  "application/pdf": FileText,
  "text/csv": FileText,
  "text/plain": FileText,
  "application/msword": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "application/vnd.ms-excel": FileText,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileText,
}

const MIME_EXT_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "text/csv": "CSV",
  "text/plain": "TXT",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
}

export function resolveFileType(mime: string): FilePreview["type"] {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  return "other"
}

export function resolveIcon(mime: string): IconComponent {
  if (mime.startsWith("image/")) return FileImage
  if (mime.startsWith("video/")) return FileVideo
  return MIME_ICONS[mime] ?? FileIcon
}

export function resolveExtLabel(mime: string): string {
  if (mime.startsWith("image/")) return (mime.split("/")[1] ?? "IMG").toUpperCase()
  if (mime.startsWith("video/")) return (mime.split("/")[1] ?? "VID").toUpperCase()
  return MIME_EXT_LABELS[mime] ?? "FILE"
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`
}

export function fileProgressKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`
}

export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true

  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)

  if (!tokens.length) return true

  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token)
    if (token.endsWith("/*")) return mime.startsWith(token.slice(0, -1))
    return mime === token
  })
}

/** Chrome, Firefox, and Safari all label clipboard screenshots "image.png". */
const GENERIC_CLIPBOARD_NAME = /^image\.[a-z0-9]+$/i

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/**
 * Clipboard screenshots arrive under a single shared name, so pasting three of
 * them would file three entries called "image" in the library. Stamping the
 * paste time keeps them apart; a real file copied from a file manager already
 * carries a meaningful name and is left alone.
 */
export function namePastedFile(file: File, index: number, stamp: Date): File {
  if (file.name && !GENERIC_CLIPBOARD_NAME.test(file.name)) return file

  // "image/svg+xml" and friends carry a suffix that is not part of the extension.
  const subtype = (file.type.split("/")[1] ?? "").split("+")[0]
  const extension = file.name.split(".").pop() || subtype || "png"
  const time = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}`
  const suffix = index > 0 ? `-${index + 1}` : ""

  return new File([file], `pasted-${time}${suffix}.${extension}`, {
    type: file.type,
    lastModified: file.lastModified,
  })
}

export function buildPreview(file: File): FilePreview {
  const type = resolveFileType(file.type)
  return {
    key: fileProgressKey(file),
    file,
    preview: type === "other" ? "" : URL.createObjectURL(file),
    type,
  }
}

export function revokePreview(preview: FilePreview): void {
  if (preview.preview) URL.revokeObjectURL(preview.preview)
}
