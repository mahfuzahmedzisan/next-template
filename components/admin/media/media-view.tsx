"use client";

import {
  FileAudio,
  FileImage,
  FileText,
  Files,
  Film,
  GalleryHorizontalEnd,
  GalleryVerticalEnd,
  Grid2x2,
  Grid3x3,
  LayoutGrid,
  List,
  Pause,
  Play,
  Square,
  Table2,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInZone, useDisplayTimeZone } from "@/lib/datetime/timezone";
import { toSameOriginStorageUrl } from "@/lib/media/same-origin-media";
import type { MediaKind, MediaRecord, MediaStatus } from "@/lib/media/types";
import { cn } from "cn";

export type MediaViewId =
  | "extra-large"
  | "large"
  | "medium"
  | "small"
  | "list"
  | "details"
  | "tiles"
  | "content";

const STORAGE_KEY = "admin.media.view";

export const MEDIA_VIEWS: Array<{
  id: MediaViewId;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: "extra-large", label: "Extra large icons", icon: Square },
  { id: "large", label: "Large icons", icon: LayoutGrid },
  { id: "medium", label: "Medium icons", icon: Grid2x2 },
  { id: "small", label: "Small icons", icon: Grid3x3 },
  { id: "list", label: "List", icon: List },
  { id: "details", label: "Details", icon: Table2 },
  { id: "tiles", label: "Tiles", icon: GalleryHorizontalEnd },
  { id: "content", label: "Content", icon: GalleryVerticalEnd },
];

const PAGE_SIZE: Record<MediaViewId, number> = {
  "extra-large": 12,
  large: 24,
  medium: 36,
  small: 48,
  list: 48,
  details: 24,
  tiles: 18,
  content: 12,
};

export function perPageFor(view: MediaViewId) {
  return PAGE_SIZE[view];
}

export function isMediaView(value: string | null): value is MediaViewId {
  return MEDIA_VIEWS.some((view) => view.id === value);
}

export function readMediaView(): MediaViewId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isMediaView(stored) ? stored : "large";
  } catch {
    return "large";
  }
}

export function storeMediaView(view: MediaViewId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // This browser can block storage. The choice still applies for this visit.
  }
}

let currentView: MediaViewId = "large";
let viewHydrated = false;
const viewListeners = new Set<() => void>();

export function getMediaView(): MediaViewId {
  if (!viewHydrated && typeof window !== "undefined") {
    currentView = readMediaView();
    viewHydrated = true;
  }
  return currentView;
}

export function subscribeMediaView(listener: () => void) {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

export function setMediaView(view: MediaViewId) {
  currentView = view;
  viewHydrated = true;
  storeMediaView(view);
  viewListeners.forEach((listener) => listener());
}

export type MediaViewRow = MediaRecord & {
  uploadPercent: number | null;
  uploadError: string | null;
  paused: boolean;
};

function statusLabel(status: MediaStatus) {
  switch (status) {
    case "awaiting_upload":
      return "Uploading";
    case "uploaded":
      return "Queued";
    case "processing":
      return "Encoding";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
  }
}

function formatSize(size: number | null) {
  if (!size) return "—";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(value: string | null, timeZone: string) {
  return formatInZone(value, timeZone);
}

function KindIcon({ kind, className }: { kind: MediaKind; className?: string }) {
  const Icon =
    kind === "video" ? Film :
    kind === "audio" ? FileAudio :
    kind === "pdf" ? FileText :
    kind === "document" ? Files :
    FileImage;
  return <Icon className={className} />;
}

function hlsReady(row: MediaViewRow) {
  return (row.kind === "video" || row.kind === "audio") && row.status === "ready" && Boolean(row.stream_url);
}

function cardActivity(row: MediaViewRow): { label: string; value: number } | null {
  if (row.status === "awaiting_upload" && row.uploadPercent !== null) {
    return { label: `Uploading ${row.uploadPercent}%`, value: row.uploadPercent };
  }
  if (row.status === "awaiting_upload" && (row.kind === "video" || row.kind === "audio")) {
    return { label: "Upload incomplete", value: 8 };
  }
  if (row.status === "uploaded") return { label: "Converting", value: 8 };
  if (row.status === "processing") return { label: `Converting ${row.progress}%`, value: row.progress };
  return null;
}

function HlsTag({ className }: { className?: string }) {
  return (
    <Badge className={cn("bg-sky-600 text-white hover:bg-sky-600", className)}>
      HLS
    </Badge>
  );
}

function previewSrc(row: MediaViewRow) {
  const poster = toSameOriginStorageUrl(row.poster_url) ?? row.poster_url;
  if (row.kind === "image") return toSameOriginStorageUrl(row.url) ?? row.url ?? poster;
  return poster;
}

export function MediaBrowser({
  view,
  rows,
  loading,
  onOpen,
  onDelete,
  onPause,
  onResume,
}: {
  view: MediaViewId;
  rows: MediaViewRow[];
  loading: boolean;
  onOpen: (row: MediaViewRow) => void;
  onDelete: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}) {
  if (loading) return <MediaViewSkeleton view={view} />;
  if (view === "details") {
    return (
      <DetailsTable
        rows={rows}
        onOpen={onOpen}
        onDelete={onDelete}
        onPause={onPause}
        onResume={onResume}
      />
    );
  }
  if (view === "list") {
    return (
      <ul className="overflow-hidden rounded-xl border">
        {rows.map((row) => (
          <ListRow key={row.id} row={row} onOpen={onOpen} onDelete={onDelete} onPause={onPause} onResume={onResume} />
        ))}
      </ul>
    );
  }
  if (view === "tiles") {
    return (
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <TileRow key={row.id} row={row} onOpen={onOpen} onDelete={onDelete} onPause={onPause} onResume={onResume} />
        ))}
      </ul>
    );
  }
  if (view === "content") {
    return (
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <ContentRow key={row.id} row={row} onOpen={onOpen} onDelete={onDelete} onPause={onPause} onResume={onResume} />
        ))}
      </ul>
    );
  }

  const grid =
    view === "extra-large"
      ? "grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
      : view === "large"
        ? "grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        : view === "medium"
          ? "grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8"
          : "grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10";

  return (
    <ul className={cn("grid items-start", grid)}>
      {rows.map((row) => (
        <IconCard
          key={row.id}
          row={row}
          dense={view === "small" || view === "medium"}
          onOpen={onOpen}
          onDelete={onDelete}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </ul>
  );
}

function IconCard({
  row,
  dense,
  onOpen,
  onDelete,
  onPause,
  onResume,
}: RowActions & { dense: boolean }) {
  const showUpload = row.status === "awaiting_upload" && row.uploadPercent !== null;
  return (
    <li className="self-start overflow-hidden rounded-lg border bg-card">
      <button type="button" className="block w-full text-left" onClick={() => onOpen(row)}>
        <Thumb
          row={row}
          aspect="aspect-[16/10]"
          iconClass={dense ? "size-4" : "size-5"}
          showKind={!dense}
          showHls={!dense}
        />
      </button>
      <div className={cn("flex items-center gap-1", dense ? "px-1.5 py-1" : "px-2 py-1.5")}>
        <button type="button" className="flex min-w-0 flex-1 items-center gap-1 text-left" onClick={() => onOpen(row)}>
          <span className="min-w-0 flex-1">
            <p className={cn("truncate font-medium", dense ? "text-[11px]" : "text-xs")}>{row.title}</p>
            {dense ? null : (
              <p className="truncate text-[11px] text-muted-foreground">{metaLine(row)}</p>
            )}
          </span>
          {dense && hlsReady(row) ? <HlsTag className="h-4 px-1 text-[9px]" /> : null}
        </button>
        <RowTools row={row} showUpload={showUpload} onDelete={onDelete} onPause={onPause} onResume={onResume} />
      </div>
    </li>
  );
}

function ListRow({ row, onOpen, onDelete, onPause, onResume }: RowActions) {
  const showUpload = row.status === "awaiting_upload" && row.uploadPercent !== null;
  return (
    <li className="flex items-center gap-2 border-b px-2 py-1.5 last:border-b-0">
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onOpen(row)}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <KindIcon kind={row.kind} className="size-4 text-muted-foreground" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{row.title}</span>
        {hlsReady(row) ? <HlsTag /> : null}
        {cardActivity(row) ? (
          <span className="hidden w-28 shrink-0 sm:block">
            <span className="mb-1 block truncate text-[10px] text-muted-foreground">{cardActivity(row)?.label}</span>
            <Progress value={cardActivity(row)?.value} className="h-1" />
          </span>
        ) : null}
        <span className="hidden w-24 shrink-0 text-xs text-muted-foreground capitalize sm:block">{row.kind}</span>
        <span className="w-16 shrink-0 text-xs text-muted-foreground">{formatSize(row.size)}</span>
      </button>
      <RowTools row={row} showUpload={showUpload} onDelete={onDelete} onPause={onPause} onResume={onResume} />
    </li>
  );
}

function TileRow({ row, onOpen, onDelete, onPause, onResume }: RowActions) {
  const showUpload = row.status === "awaiting_upload" && row.uploadPercent !== null;
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-2">
      <button type="button" className="size-14 shrink-0 overflow-hidden rounded-md" onClick={() => onOpen(row)}>
        <Thumb row={row} aspect="size-14" iconClass="size-4" showKind={false} showHls={false} />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(row)}>
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{row.title}</span>
          {hlsReady(row) ? <HlsTag className="h-4 px-1 text-[9px]" /> : null}
        </p>
        <p className="truncate text-xs text-muted-foreground capitalize">
          {cardActivity(row)?.label ?? `${row.kind} · ${formatSize(row.size)}`}
        </p>
      </button>
      <RowTools row={row} showUpload={showUpload} onDelete={onDelete} onPause={onPause} onResume={onResume} />
    </li>
  );
}

function ContentRow({ row, onOpen, onDelete, onPause, onResume }: RowActions) {
  const showUpload = row.status === "awaiting_upload" && row.uploadPercent !== null;
  const timeZone = useDisplayTimeZone();
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-2">
      <button type="button" className="w-28 shrink-0 overflow-hidden rounded-lg sm:w-40" onClick={() => onOpen(row)}>
        <Thumb row={row} aspect="aspect-video" iconClass="size-5" showKind={false} showHls={false} />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(row)}>
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{row.title}</span>
          {hlsReady(row) ? <HlsTag className="h-4 px-1 text-[9px]" /> : null}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground capitalize">
          {cardActivity(row)?.label ?? row.kind}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatSize(row.size)} · {formatWhen(row.created_at, timeZone)}
        </p>
        <p className="text-xs text-muted-foreground">{statusLabel(row.status)}</p>
      </button>
      <RowTools row={row} showUpload={showUpload} onDelete={onDelete} onPause={onPause} onResume={onResume} />
    </li>
  );
}

function DetailsTable({ rows, onOpen, onDelete, onPause, onResume }: {
  rows: MediaViewRow[];
} & Omit<RowActions, "row">) {
  const timeZone = useDisplayTimeZone();
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Size</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Modified</th>
            <th className="px-3 py-2 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const showUpload = row.status === "awaiting_upload" && row.uploadPercent !== null;
            return (
              <tr key={row.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">
                  <button type="button" className="flex max-w-xs items-center gap-2 text-left" onClick={() => onOpen(row)}>
                    <KindIcon kind={row.kind} className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{row.title}</span>
                    {hlsReady(row) ? <HlsTag /> : null}
                  </button>
                </td>
                <td className="px-3 py-2 capitalize text-muted-foreground">{row.kind}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatSize(row.size)}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {cardActivity(row) ? (
                    <span className="block w-28">
                      <span className="mb-1 block text-[10px]">{cardActivity(row)?.label}</span>
                      <Progress value={cardActivity(row)?.value} className="h-1" />
                    </span>
                  ) : (
                    statusLabel(row.status)
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatWhen(row.created_at, timeZone)}</td>
                <td className="px-2 py-1">
                  <RowTools row={row} showUpload={showUpload} onDelete={onDelete} onPause={onPause} onResume={onResume} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type RowActions = {
  row: MediaViewRow;
  onOpen: (row: MediaViewRow) => void;
  onDelete: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
};

function RowTools({
  row,
  showUpload,
  onDelete,
  onPause,
  onResume,
}: {
  row: MediaViewRow;
  showUpload: boolean;
  onDelete: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center">
      {showUpload ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={row.paused ? "Resume upload" : "Pause upload"}
          onClick={() => (row.paused ? onResume(row.id) : onPause(row.id))}
        >
          {row.paused ? <Play /> : <Pause />}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Delete ${row.title}`}
        onClick={() => onDelete(row.id)}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function Thumb({
  row,
  aspect,
  iconClass,
  showKind = true,
  showHls = true,
}: {
  row: MediaViewRow;
  aspect: string;
  iconClass: string;
  showKind?: boolean;
  showHls?: boolean;
}) {
  const src = previewSrc(row);
  const activity = cardActivity(row);
  return (
    <div className={cn("relative overflow-hidden bg-muted", aspect)}>
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- blurred copy only fills the side bars */}
          <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-md" />
          {/* eslint-disable-next-line @next/next/no-img-element -- storage URL is rewritten to this site */}
          <img src={src} alt={row.alt || row.title} className="relative size-full object-contain" />
        </>
      ) : (
        <div className="flex size-full items-center justify-center">
          <KindIcon kind={row.kind} className={cn(iconClass, "text-muted-foreground")} />
        </div>
      )}
      {showKind || (showHls && hlsReady(row)) ? (
        <div className="absolute inset-x-1.5 top-1.5 flex items-start justify-between gap-1">
          {showKind ? (
            <Badge variant="secondary" className="h-4 max-w-[55%] truncate px-1 text-[9px] capitalize">
              {row.kind}
            </Badge>
          ) : (
            <span />
          )}
          {showHls && hlsReady(row) ? <HlsTag className="h-4 px-1 text-[9px]" /> : null}
        </div>
      ) : null}
      {activity ? (
        <div className="absolute inset-x-0 bottom-0 bg-background/90 px-2 py-1.5">
          <p className="mb-1 text-[10px] font-medium">{activity.label}</p>
          <Progress value={activity.value} className="h-1" />
        </div>
      ) : null}
    </div>
  );
}

function metaLine(row: MediaViewRow) {
  const size = formatSize(row.size);
  if (row.uploadPercent !== null && row.status === "awaiting_upload") return `${size} · ${row.uploadPercent}%`;
  if (row.status === "uploaded") return `${size} · Converting`;
  if (row.status === "processing") return `${size} · ${row.progress}%`;
  if (row.uploadError || row.status === "failed") {
    return row.status === "failed" ? `${size} · Conversion failed` : row.uploadError || size;
  }
  return size === "—" ? statusLabel(row.status) : size;
}

function MediaViewSkeleton({ view }: { view: MediaViewId }) {
  if (view === "details" || view === "list") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border p-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }
  const count = view === "extra-large" ? 4 : view === "content" ? 3 : 8;
  return (
    <ul className={cn(
      "grid",
      view === "extra-large" && "grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4",
      view === "large" && "grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
      view === "medium" && "grid-cols-4 gap-2 md:grid-cols-6 xl:grid-cols-8",
      view === "small" && "grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-10",
      view === "tiles" && "grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3",
      view === "content" && "grid-cols-1 gap-2",
    )}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Skeleton className={cn("w-full", view === "content" ? "h-24" : view === "tiles" ? "h-16" : "aspect-[16/10]")} />
        </li>
      ))}
    </ul>
  );
}
