import type { ReactNode } from "react"

export interface ExistingFile {
  id: number | string
  path: string
  url: string
  mime_type: string
  name?: string
  size?: number
}

export type FileProgresses = Record<string, number>

export type FileRejectionReason = "size" | "type" | "count" | "duplicate"

export interface FileRejection {
  file: File
  reason: FileRejectionReason
  message: string
}

export interface FileUploadClassNames {
  wrapper?: string
  dropzone?: string
  dropzoneContent?: string
  grid?: string
  card?: string
  cardMedia?: string
  cardInfo?: string
  removeButton?: string
  progressOverlay?: string
  aggregateProgress?: string
  error?: string
}

export type FileUploadVariant = "default" | "avatar"

export interface FileUploadProps {
  value?: File | File[] | null
  onChange: (files: File | File[] | null) => void
  existingFiles?: ExistingFile[]
  onRemoveExisting?: (id: number | string) => void
  multiple?: boolean
  accept?: string
  maxSize?: number
  maxFiles?: number
  dedupe?: boolean
  /** Accept images pasted from the clipboard while this component is mounted. */
  paste?: boolean
  disabled?: boolean
  required?: boolean
  isUploading?: boolean
  uploadProgress?: number | null
  fileProgresses?: FileProgresses
  /** Cancel the active AbortController or XMLHttpRequest upload. */
  onCancel?: () => void
  onReject?: (rejections: FileRejection[]) => void
  showRejections?: boolean
  lightbox?: boolean
  placeholder?: string
  hint?: string
  variant?: FileUploadVariant
  avatarSize?: number
  avatarFallback?: ReactNode
  className?: string
  classNames?: FileUploadClassNames
  error?: string
}

export interface FileUploadHandle {
  openFileBrowser: () => void
  clearFiles: () => void
}

export interface FilePreview {
  key: string
  file: File
  preview: string
  type: "image" | "video" | "other"
}
