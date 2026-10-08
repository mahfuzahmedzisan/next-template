export type VideoStatus =
  | "awaiting_upload"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export type VideoRecord = {
  id: number;
  title: string;
  slug: string;
  status: VideoStatus;
  progress: number;
  error_message: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  stream_url: string | null;
  poster_url: string | null;
  created_at: string | null;
};

export type VideoListResult = {
  videos: VideoRecord[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type CreateVideoResult = {
  video_id: number;
  tus_endpoint: string;
  upload_token: string;
  video: VideoRecord;
};
