"use client";

import * as tus from "tus-js-client";

export type TusUploadHandle = {
  start: () => void;
  pause: () => void;
  resume: () => void;
};

/**
 * Stored upload URLs can predate the https endpoint. An http URL on an https
 * page is blocked as mixed content and never reaches tusd, so the upload
 * would fail instead of falling back to a fresh one.
 */
function resumableUrl(uploadUrl: string | null, endpoint: string): string | null {
  if (!uploadUrl) return null;
  try {
    const stored = new URL(uploadUrl);
    const target = new URL(endpoint, window.location.href);
    if (stored.host !== target.host) return null;
    stored.protocol = target.protocol;
    return stored.toString();
  } catch {
    return null;
  }
}

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
    // tusd metadata carries the media id, so an upload is only resumable for the item it was created for.
    fingerprint: async (file) =>
      ["media", options.mediaId, file.name, file.type, file.size, file.lastModified].join("-"),
    removeFingerprintOnSuccess: true,
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

  // start() looks up previous uploads asynchronously; a pause or unmount in
  // that window must stop the upload from starting once the lookup returns.
  let aborted = false;

  return {
    start() {
      aborted = false;
      void upload
        .findPreviousUploads()
        .then((previous) => {
          const storage = tus.defaultOptions.urlStorage;
          for (const entry of previous) {
            const url = resumableUrl(entry.uploadUrl, options.endpoint);
            if (url && entry.metadata?.media_id === String(options.mediaId)) {
              upload.resumeFromPreviousUpload({ ...entry, uploadUrl: url });
              return;
            }
            void storage.removeUpload(entry.urlStorageKey).catch(() => undefined);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!aborted) upload.start();
        });
    },
    pause() {
      aborted = true;
      void upload.abort(false);
    },
    resume() {
      aborted = false;
      upload.start();
    },
  };
}
