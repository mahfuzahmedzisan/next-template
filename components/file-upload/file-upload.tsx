"use client"

import dynamic from "next/dynamic"
import gsap from "gsap"
import { AlertCircle, Upload } from "lucide-react"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"

import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion"
import { useFileSelection } from "@/hooks/use-file-selection"
import { fileProgressKey, resolveFileType } from "@/lib/file-upload"
import { cn } from "@/lib/utils"
import type { FileUploadClassNames, FileUploadHandle, FileUploadProps } from "@/types/file-upload"

import { AggregateProgressRow } from "./aggregate-progress"
import { FileCard } from "./file-card"

const FileUploadLightbox = dynamic(
  () => import("./file-upload-lightbox").then((module) => module.FileUploadLightbox),
  { ssr: false }
)

function avatarClassNames(overrides?: FileUploadClassNames): FileUploadClassNames {
  return {
    wrapper: "flex flex-wrap items-start gap-4",
    card: "rounded-full border-2 border-border/70 bg-card shadow-sm ring-1 ring-primary/10",
    cardMedia: "size-full",
    dropzone:
      "shrink-0 rounded-full border-2 border-dashed border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-primary/5",
    dropzoneContent: "flex flex-col items-center gap-0.5 px-2 text-center",
    error: "text-sm text-destructive",
    ...overrides,
  }
}

function AvatarUploadCaption({
  title,
  description,
  fileName,
  fileSize,
}: {
  title: string
  description?: string
  fileName?: string
  fileSize?: number
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1 pt-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {fileName && <p className="truncate text-sm text-muted-foreground">{fileName}</p>}
      {fileSize !== undefined && <p className="text-xs text-muted-foreground">{(fileSize / 1024).toFixed(1)} KB</p>}
      {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}

/**
 * A controlled Next.js client component for selecting and previewing files.
 *
 * Pass upload state from your fetch/XHR implementation. Use `uploadProgress` for
 * one request, or `fileProgresses` keyed by `fileProgressKey(file)` for parallel
 * XMLHttpRequest uploads. Connect `onCancel` to an `AbortController.abort()` or
 * `XMLHttpRequest.abort()` handler.
 */
const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(function FileUpload(
  {
    value,
    onChange,
    existingFiles = [],
    onRemoveExisting,
    multiple = false,
    accept,
    maxSize = 10,
    maxFiles,
    dedupe = true,
    paste = false,
    disabled = false,
    required = false,
    isUploading = false,
    uploadProgress,
    fileProgresses,
    onCancel,
    onReject,
    showRejections = true,
    lightbox = false,
    placeholder = "Drag & drop or click to browse",
    hint,
    variant = "default",
    avatarSize = 112,
    avatarFallback,
    className,
    classNames = {},
    error,
  },
  ref
) {
  const isAvatar = variant === "avatar"
  const mergedClassNames = isAvatar ? avatarClassNames(classNames) : classNames
  const {
    inputRef,
    filePreviews,
    rejections,
    isDragging,
    handleChange,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    removeNew,
    clearFiles,
  } = useFileSelection({
    value,
    onChange,
    multiple,
    accept,
    maxSize,
    maxFiles,
    dedupe,
    paste,
    disabled,
    onReject,
    existingFiles,
  })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const dropzoneRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const previewCountRef = useRef(0)
  const { prefersReducedMotion } = usePrefersReducedMotion()

  useEffect(() => {
    const node = dropzoneRef.current
    if (!node) return
    if (prefersReducedMotion) {
      gsap.set(node, { scale: 1 })
      return
    }
    gsap.to(node, {
      scale: isDragging ? 1.015 : 1,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    })
  }, [isDragging, prefersReducedMotion])

  useEffect(() => {
    const count = filePreviews.length
    if (count <= previewCountRef.current) {
      previewCountRef.current = count
      return
    }
    previewCountRef.current = count
    const cards = gridRef.current?.querySelectorAll("[data-file-card]")
    if (!cards?.length) return
    const card = cards[cards.length - 1]
    if (prefersReducedMotion) {
      gsap.set(card, { autoAlpha: 1, y: 0 })
      return
    }
    gsap.fromTo(
      card,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" },
    )
  }, [filePreviews.length, prefersReducedMotion])

  useImperativeHandle(
    ref,
    () => ({
      openFileBrowser: () => inputRef.current?.click(),
      clearFiles,
    }),
    [clearFiles, inputRef]
  )

  const lightboxSlides = useMemo(
    () =>
      !lightbox
        ? []
        : [
            ...existingFiles
              .filter((file) => resolveFileType(file.mime_type) !== "other")
              .map((file) =>
                resolveFileType(file.mime_type) === "video"
                  ? { type: "video" as const, sources: [{ src: file.url, type: file.mime_type }] }
                  : { src: file.url, alt: file.name ?? file.path.split("/").pop() ?? "" }
              ),
            ...filePreviews
              .filter((preview) => preview.type !== "other")
              .map((preview) =>
                preview.type === "video"
                  ? { type: "video" as const, sources: [{ src: preview.preview, type: preview.file.type }] }
                  : { src: preview.preview, alt: preview.file.name }
              ),
          ],
    [existingFiles, filePreviews, lightbox]
  )

  const openLightbox = useCallback(
    (source: "existing" | "new", localIndex: number) => {
      if (!lightbox) return
      const existingMediaCount = existingFiles.filter((file) => resolveFileType(file.mime_type) !== "other").length
      setLightboxIndex(source === "existing" ? localIndex : existingMediaCount + localIndex)
      setLightboxOpen(true)
    },
    [existingFiles, lightbox]
  )

  const totalFiles = filePreviews.length + existingFiles.length
  const canAddMore = multiple ? !maxFiles || totalFiles < maxFiles : totalFiles === 0
  const hasPerFile = fileProgresses != null
  const hasAggregate = uploadProgress != null
  const pulseLoading = isUploading && !hasPerFile && !hasAggregate
  const cardCancel = onCancel && isUploading && hasPerFile ? onCancel : undefined

  const resolveCardProgress = (file: File) => {
    if (hasPerFile) return fileProgresses?.[fileProgressKey(file)] ?? fileProgresses?.[file.name]
    if (hasAggregate) return uploadProgress ?? undefined
    return undefined
  }

  const makeOnPreview = (source: "existing" | "new", index: number, type: "image" | "video" | "other") =>
    lightbox && type !== "other" ? () => openLightbox(source, index) : undefined

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      multiple={multiple}
      accept={accept}
      disabled={disabled}
      required={required && totalFiles === 0}
      onChange={handleChange}
      className="sr-only"
      tabIndex={-1}
    />
  )

  const dropZone = canAddMore && (
    <div
      ref={dropzoneRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload area – click or drag files here"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !disabled) {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      className={cn(
        isAvatar
          ? [
              "relative flex shrink-0 items-center justify-center select-none will-change-transform",
              isDragging ? "border-primary bg-primary/10" : "",
              disabled && "pointer-events-none cursor-not-allowed opacity-50",
              error && "border-destructive",
            ]
          : [
              "flex w-full min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed px-6 py-10 text-center select-none will-change-transform hover:border-primary hover:bg-primary/5",
              isDragging ? "border-primary bg-primary/10" : "border-border",
              disabled && "pointer-events-none cursor-not-allowed opacity-50",
              error && "border-destructive",
            ],
        mergedClassNames.dropzone
      )}
      style={isAvatar ? { width: avatarSize, height: avatarSize } : undefined}
    >
      {fileInput}
      <div
        className={cn(
          isAvatar
            ? "flex flex-col items-center gap-1"
            : "flex w-full min-w-0 max-w-full flex-col items-center gap-1.5 px-1",
          mergedClassNames.dropzoneContent
        )}
      >
        {isAvatar ? avatarFallback ?? <Upload className="size-5 text-muted-foreground" aria-hidden="true" /> : <Upload className="size-8 text-muted-foreground" aria-hidden="true" />}
        {!isAvatar && (
          <>
            <p className="text-sm font-medium text-foreground">{placeholder}</p>
            {hint && (
              <p className="max-w-prose text-xs leading-relaxed text-balance break-words text-muted-foreground">
                {hint}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Max {maxSize} MB per file
              {maxFiles ? ` · up to ${maxFiles} files` : null}
              {paste ? " · or paste a screenshot" : null}
            </p>
          </>
        )}
      </div>
    </div>
  )

  const aggregateRow = isUploading && !hasPerFile && totalFiles > 0 && (
    <AggregateProgressRow
      value={hasAggregate ? uploadProgress ?? 0 : 0}
      indeterminate={pulseLoading}
      onCancel={onCancel}
      className={mergedClassNames.aggregateProgress}
    />
  )

  const rejectionMessages = showRejections && rejections.length > 0 && (
    <div className={cn("space-y-1", mergedClassNames.error)}>
      {rejections.map((rejection) => (
        <p key={`${fileProgressKey(rejection.file)}-${rejection.reason}`} className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{rejection.message}</span>
        </p>
      ))}
    </div>
  )

  const rootClassName = cn(
    isAvatar ? mergedClassNames.wrapper : "w-full min-w-0 space-y-3",
    className,
    !isAvatar && mergedClassNames.wrapper
  )
  const lightboxElement = lightbox && lightboxOpen && (
    <FileUploadLightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={lightboxSlides} index={lightboxIndex} />
  )

  if (!multiple && existingFiles.length > 0 && filePreviews.length === 0) {
    const file = existingFiles[0]
    const type = resolveFileType(file.mime_type)
    const name = file.name ?? file.path.split("/").pop() ?? "File"
    return (
      <div className={rootClassName}>
        {lightboxElement}
        {isAvatar && fileInput}
        <div className={cn(isAvatar && "flex items-center gap-4")}>
          <div className={cn(isAvatar && "relative shrink-0")}>
            <FileCard
              name={name}
              size={file.size}
              preview={file.url}
              type={type}
              mime={file.mime_type}
              compact={isAvatar}
              fixedSize={isAvatar ? avatarSize : undefined}
              onRemove={onRemoveExisting && !isUploading ? () => onRemoveExisting(file.id) : undefined}
              onPreview={isAvatar ? undefined : makeOnPreview("existing", 0, type)}
              classNames={mergedClassNames}
            />
            {isAvatar && !isUploading && <button type="button" aria-label="Change photo" onClick={() => inputRef.current?.click()} className="absolute inset-0 z-20 rounded-full" />}
          </div>
          {isAvatar && <AvatarUploadCaption title="Profile photo" fileName={name} fileSize={file.size} description="Click the photo to replace, or remove it." />}
        </div>
        {error && <p className={cn("mt-1.5 text-sm text-destructive", mergedClassNames.error)}>{error}</p>}
      </div>
    )
  }

  if (!multiple && filePreviews.length > 0) {
    const preview = filePreviews[0]
    return (
      <div className={cn(rootClassName, isAvatar && "space-y-2")}>
        {lightboxElement}
        {isAvatar && fileInput}
        <div className={cn(isAvatar && "flex items-center gap-4")}>
          <div className={cn(isAvatar && "relative shrink-0")}>
            <FileCard
              name={preview.file.name}
              size={preview.file.size}
              preview={preview.preview}
              type={preview.type}
              mime={preview.file.type}
              compact={isAvatar}
              fixedSize={isAvatar ? avatarSize : undefined}
              onRemove={!isUploading ? () => removeNew(0) : undefined}
              onCancel={cardCancel}
              onPreview={isAvatar ? undefined : makeOnPreview("new", 0, preview.type)}
              progress={resolveCardProgress(preview.file)}
              loading={pulseLoading}
              classNames={mergedClassNames}
            />
            {isAvatar && !isUploading && <button type="button" aria-label="Change photo" onClick={() => inputRef.current?.click()} className="absolute inset-0 z-20 rounded-full" />}
          </div>
          {isAvatar && <AvatarUploadCaption title="Profile photo" fileName={preview.file.name} fileSize={preview.file.size} description="Click the photo to replace, or remove it." />}
        </div>
        {aggregateRow}
        {rejectionMessages}
        {error && <p className={cn("text-sm text-destructive", mergedClassNames.error)}>{error}</p>}
      </div>
    )
  }

  return (
    <div className={rootClassName}>
      {lightboxElement}
      {isAvatar ? (
        <div className="flex flex-wrap items-start gap-4">
          {dropZone}
          <AvatarUploadCaption title={placeholder} description={hint ? `${hint} · Max ${maxSize} MB` : `Max ${maxSize} MB`} />
        </div>
      ) : (
        dropZone
      )}
      {multiple && aggregateRow}
      {rejectionMessages}
      {!isAvatar && totalFiles > 0 && (
        <div
          ref={gridRef}
          className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", mergedClassNames.grid)}
        >
          {existingFiles.map((file, index) => {
            const type = resolveFileType(file.mime_type)
            return (
              <FileCard
                key={file.id}
                name={file.name ?? file.path.split("/").pop() ?? "File"}
                size={file.size}
                preview={file.url}
                type={type}
                mime={file.mime_type}
                onRemove={onRemoveExisting && !isUploading ? () => onRemoveExisting(file.id) : undefined}
                onPreview={makeOnPreview("existing", index, type)}
                classNames={mergedClassNames}
              />
            )
          })}
          {filePreviews.map((preview, index) => {
            const mediaIndex = filePreviews.slice(0, index).filter((item) => item.type !== "other").length
            return (
              <FileCard
                key={preview.key}
                name={preview.file.name}
                size={preview.file.size}
                preview={preview.preview}
                type={preview.type}
                mime={preview.file.type}
                onRemove={!isUploading ? () => removeNew(index) : undefined}
                onCancel={cardCancel}
                onPreview={makeOnPreview("new", mediaIndex, preview.type)}
                progress={resolveCardProgress(preview.file)}
                loading={pulseLoading}
                classNames={mergedClassNames}
              />
            )
          })}
        </div>
      )}
      {error && <p className={cn("text-sm text-destructive", mergedClassNames.error)}>{error}</p>}
    </div>
  )
})

FileUpload.displayName = "FileUpload"

export default FileUpload
