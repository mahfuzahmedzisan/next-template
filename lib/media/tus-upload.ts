"use client";

import * as tus from "tus-js-client";

export type TusUploadHandle = {
  start: () => void;
  pause: () => void;
  resume: () => void;
};

export function createMediaUpload(options: {
  file: File;
  endpoint: string;
  token: string;
  mediaId: number;
  onProgress: (percent: number) => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
}): TusUploadHandle {
  const upload = new tus.Upload(options.file, {
    endpoint: options.endpoint,
    // The browser uploads straight to tusd. Nginx allows 16 MB per PATCH.
    chunkSize: 8 * 1024 * 1024,
    retryDelays: [0, 1000, 3000, 5000, 10000],
    metadata: {
      filename: options.file.name,
      filetype: options.file.type || "application/octet-stream",
      media_id: String(options.mediaId),
    },
    headers: {
      Authorization: `Bearer ${options.token}`,
    },
    onError(error) {
      options.onError(error);
    },
    onProgress(bytesSent, bytesTotal) {
      const percent = bytesTotal > 0 ? Math.round((bytesSent / bytesTotal) * 100) : 0;
      options.onProgress(percent);
    },
    onSuccess() {
      options.onSuccess();
    },
  });

  return {
    start() {
      void upload.findPreviousUploads().then((previous) => {
        if (previous.length > 0) {
          upload.resumeFromPreviousUpload(previous[0]);
        }
        upload.start();
      });
    },
    pause() {
      void upload.abort(false);
    },
    resume() {
      upload.start();
    },
  };
}
