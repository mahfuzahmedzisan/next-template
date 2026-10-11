# HLS media library

Raw uploads are not playable. The browser sends resumable tus chunks to tusd inside the API container. A Supervisor program in that same container encodes adaptive HLS. Playback is `master.m3u8` only.

## Flow

1. The admin page `POST /api/admin/videos` asks the Next BFF to create a `Video` row. The BFF calls Laravel and returns `tus_endpoint` plus a short-lived upload token. The Sanctum bearer token stays in the httpOnly cookie.
2. `tus-js-client` uploads straight to the API `tus_endpoint` in about 8 MB chunks. Nginx on the API allows that origin via `FRONTEND_URLS`. Pause is `abort(false)`. Resume uses `findPreviousUploads()` and `start()`. The fingerprint includes the media id, so a stored upload only resumes for its own item. Stored URLs on another host are discarded, and `http` URLs are upgraded to the endpoint's protocol to avoid mixed-content blocks. The fingerprint is removed after success. Playback URLs are rewritten to `/api/storage/...`. Upload bytes do not pass through the Next.js host.
3. tusd calls Laravel on localhost: `POST /internal/tus/{pre-create,pre-finish,post-finish,post-terminate}` with `TUS_HOOK_SECRET`. `pre-finish` runs before tusd answers the browser, so a large file is stored before the client is told the upload finished.
4. `pre-finish` stores the file on the Spatie `source` collection and dispatches `GenerateHlsJob` on the `media` queue.
5. `[program:laravel-media-worker]` in `API/mahfuz-ahmed-api/docker/supervisord.conf` encodes 360p, 720p, and 1080p (1080p is skipped when the source is shorter). Segments are about 10 seconds.
6. `stream_url` is set only when status is `ready`. It points at `videos/{ulid}/hls/master.m3u8` on the public disk.

Upload percent stays in the browser. Encode percent is broadcast as `.video.processing` on `App.Models.User.{id}`.

## One Coolify app

Do not add a second Coolify service. The API image runs php-fpm, nginx, tusd, the default queue (`QUEUE_NAMES=default`), and the media worker (`--queue=media --timeout=1800 --tries=1`). They share `/var/www/storage`.

Set `TUS_HOOK_SECRET` (hex, no spaces) on the API app. Nginx builds the `/tus/` and `/storage/` CORS allow-list from `FRONTEND_URLS` at container start.

Local encode without Docker:

```bash
php artisan queue:work redis --queue=media --timeout=1800 --tries=1
```

Tests mock the encoder and do not need FFmpeg. On Windows, point `FFMPEG_BINARIES` and `FFPROBE_BINARIES` at the executables on `PATH` before a real encode.
