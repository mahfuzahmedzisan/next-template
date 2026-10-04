"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ChangeEvent, DragEvent, RefObject } from "react"

import {
  BYTES_PER_MB,
  buildPreview,
  fileProgressKey,
  matchesAccept,
  namePastedFile,
  revokePreview,
} from "@/lib/file-upload"
import type { ExistingFile, FilePreview, FileRejection, FileUploadProps } from "@/types/file-upload"

interface UseFileSelectionOptions extends Pick<
  FileUploadProps,
  "value" | "onChange" | "multiple" | "accept" | "maxSize" | "maxFiles" | "dedupe" | "paste" | "disabled" | "onReject"
> {
  existingFiles: ExistingFile[]
}

export function useFileSelection({
  value,
  onChange,
  multiple = false,
  accept,
  maxSize = 10,
  maxFiles,
  dedupe = true,
  paste = false,
  disabled = false,
  onReject,
  existingFiles,
}: UseFileSelectionOptions) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const previewsRef = useRef<FilePreview[]>([])
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [rejections, setRejections] = useState<FileRejection[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    previewsRef.current = filePreviews
  }, [filePreviews])

  useEffect(() => () => previewsRef.current.forEach(revokePreview), [])

  const previousValue = useRef(value)
  useEffect(() => {
    if (value === previousValue.current) return
    previousValue.current = value

    if (!value) {
      const clearTimer = window.setTimeout(() => {
        setFilePreviews((previews) => {
          previews.forEach(revokePreview)
          return []
        })
      }, 0)
      return () => clearTimeout(clearTimer)
    }
  }, [value])

  const processFiles = useCallback(
    (raw: FileList | File[]) => {
      const incoming = Array.from(raw)
      const rejected: FileRejection[] = []
      const currentFiles = Array.isArray(value) ? value : value ? [value] : []
      const seen = new Set<string>()

      if (dedupe) currentFiles.forEach((file) => seen.add(fileProgressKey(file)))

      let valid: File[] = []
      for (const file of incoming) {
        if (dedupe && seen.has(fileProgressKey(file))) {
          rejected.push({ file, reason: "duplicate", message: `"${file.name}" is already selected.` })
        } else if (!matchesAccept(file, accept)) {
          rejected.push({ file, reason: "type", message: `"${file.name}" is not an accepted file type.` })
        } else if (file.size / BYTES_PER_MB > maxSize) {
          rejected.push({ file, reason: "size", message: `"${file.name}" exceeds the ${maxSize} MB limit.` })
        } else {
          seen.add(fileProgressKey(file))
          valid.push(file)
        }
      }

      if (!multiple) {
        valid = valid.slice(0, 1)
      } else if (maxFiles) {
        const room = Math.max(0, maxFiles - currentFiles.length - existingFiles.length)
        if (valid.length > room) {
          valid.slice(room).forEach((file) =>
            rejected.push({
              file,
              reason: "count",
              message: `Maximum ${maxFiles} files allowed — "${file.name}" was skipped.`,
            })
          )
          valid = valid.slice(0, room)
        }
      }

      setRejections(rejected)
      if (rejected.length) onReject?.(rejected)
      if (!valid.length) return

      const previews = valid.map(buildPreview)
      if (multiple) {
        setFilePreviews((current) => [...current, ...previews])
        onChange([...currentFiles, ...valid])
      } else {
        setFilePreviews((current) => {
          current.forEach(revokePreview)
          return previews
        })
        onChange(valid[0])
      }
    },
    [accept, dedupe, existingFiles.length, maxFiles, maxSize, multiple, onChange, onReject, value]
  )

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length) processFiles(event.target.files)
      event.target.value = ""
    },
    [processFiles]
  )

  /**
   * Listening on the document rather than the dropzone means the user can hit
   * paste as soon as the dialog opens, without hunting for something to focus.
   * A clipboard carrying no files is left alone, so pasting text into any
   * nearby input still behaves normally.
   */
  useEffect(() => {
    if (!paste || disabled) return

    const onPaste = (event: ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? [])
      if (!pasted.length) return

      event.preventDefault()
      const stamp = new Date()
      processFiles(pasted.map((file, index) => namePastedFile(file, index, stamp)))
    }

    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [disabled, paste, processFiles])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (disabled) return
      dragDepth.current += 1
      setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      dragDepth.current = 0
      setIsDragging(false)
      if (!disabled && event.dataTransfer.files.length) processFiles(event.dataTransfer.files)
    },
    [disabled, processFiles]
  )

  const removeNew = useCallback(
    (index: number) => {
      setFilePreviews((previews) => {
        const removed = previews[index]
        if (removed) revokePreview(removed)
        return previews.filter((_, previewIndex) => previewIndex !== index)
      })
      if (multiple) {
        const currentFiles = Array.isArray(value) ? value : []
        const next = currentFiles.filter((_, fileIndex) => fileIndex !== index)
        onChange(next.length ? next : null)
      } else {
        onChange(null)
      }
    },
    [multiple, onChange, value]
  )

  const clearFiles = useCallback(() => {
    setFilePreviews((previews) => {
      previews.forEach(revokePreview)
      return []
    })
    setRejections([])
    onChange(null)
  }, [onChange])

  return {
    inputRef: inputRef as RefObject<HTMLInputElement>,
    filePreviews,
    rejections,
    isDragging,
    processFiles,
    handleChange,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    removeNew,
    clearFiles,
  }
}
