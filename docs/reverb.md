# Reverb (three services)

Shared credentials: generate `REVERB_APP_ID`, `REVERB_APP_KEY`, and `REVERB_APP_SECRET` once. The Reverb server is the source of truth. Copy the same values onto the API. Next.js only gets the public pieces.

| Service | Repo | What it runs |
|---------|------|----------------|
| WebSocket | `next-template-reverb` | `php artisan reverb:start` (Docker port 8080) |
| API | `next-template-api` | Publisher only. `BROADCAST_CONNECTION=reverb`. No `reverb:start`. |
| Next.js | `next-template` | Laravel Echo + BFF `POST /api/broadcasting/auth` |

## Local ports

| Process | URL |
|---------|-----|
| Next.js | `http://localhost:3000` |
| API | `http://127.0.0.1:8000` (or whatever `LARAVEL_API_URL` is) |
| Reverb | `ws://localhost:8080` |

`REVERB_ALLOWED_ORIGINS` on the Reverb server is a comma-separated list of **bare hostnames** for the Next app (`localhost,127.0.0.1`). No scheme, no port.

## Local smoke test

1. Start Reverb (`php artisan reverb:start` or `docker compose up` in `next-template-reverb`).
2. API `.env`: matching `REVERB_*` and `BROADCAST_CONNECTION=reverb`.
3. Next `.env`: matching `NEXT_PUBLIC_REVERB_APP_KEY`, `HOST`, `PORT`, `SCHEME`, plus existing `LARAVEL_API_URL` and `BFF_SECRET`.
4. Sign in and open `/admin/realtime`.
5. Status should become **connected**. Trigger public ping, then private test. Both should show up under Received events.

Diagnostic events use `ShouldBroadcastNow`, so a queue worker is not required for this page. Later product events that implement `ShouldBroadcast` need `php artisan queue:work` on the API.

## Production

| Service | Notes |
|---------|--------|
| Reverb (Coolify) | TLS at the proxy, container port 8080. `REVERB_HOST` is the public WSS hostname, `REVERB_PORT=443`, `REVERB_SCHEME=https`. Allowed origins = the Next.js hostname. |
| API (Coolify) | Same `REVERB_APP_*` and public host/port/scheme. Do not run Reverb in this image. |
| Next (Vercel) | `NEXT_PUBLIC_REVERB_*` are baked at build time. Never set `REVERB_APP_SECRET` or `BFF_SECRET` as `NEXT_PUBLIC_`. |

Private channel auth stays on the API (`POST /api/v1/broadcasting/auth`, Passport). The browser only calls the Next BFF, which adds `X-BFF-Secret` and the bearer token from the httpOnly session cookie.

Wrong secret: public ping fails on the API. Wrong allowed origins: the WebSocket is refused. Missing session: private auth returns 401.
