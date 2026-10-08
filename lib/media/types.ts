export type MediaKind = "image" | "video" | "audio" | "pdf" | "document";

export type MediaStatus =
  | "awaiting_upload"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export type MediaRecord = {
  id: number;
  title: string;
  slug: string;
  kind: MediaKind;
  alt: string | null;
  keywords: string[];
  status: MediaStatus;
  progress: number;
  error_message: string | null;
  mime: string | null;
  extension: string | null;
  size: number | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  url: string | null;
  stream_url: string | null;
  poster_url: string | null;
  created_at: string | null;
};

export type MediaListResult = {
  media: MediaRecord[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type CreateMediaResult = {
  media_id: number;
  tus_endpoint: string;
  upload_token: string;
  media: MediaRecord;
};

export type MediaTypeFilter = "all" | MediaKind;
