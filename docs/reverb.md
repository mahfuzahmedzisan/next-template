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

## Production hosts (current)

| Role | URL |
|------|-----|
| Next.js (Vercel) | `https://next-template-eta.vercel.app` |
| API (Coolify) | `https://api.next.maktechlaravel.cloud` |
| Reverb (Coolify) | `https://ws.next.maktechlaravel.cloud` (WSS on 443 → container 8080) |

Generate once and paste the **same** values into Reverb + API (and the public key into Next):

```bash
# APP_ID can be any short string; key/secret should be random hex
openssl rand -hex 8    # → REVERB_APP_ID (or use a fixed label like next-template)
openssl rand -hex 16   # → REVERB_APP_KEY
openssl rand -hex 32   # → REVERB_APP_SECRET
openssl rand -base64 32  # → BFF_SECRET (Next + API, same value)
openssl rand -base64 32  # → SESSION_SECRET (Next only)
```

### 1) Coolify — `next-template-reverb`

Port / health: container **8080**. Coolify proxy TLS to `ws.next.maktechlaravel.cloud`. Healthcheck is in the Dockerfile (`curl` to `127.0.0.1:8080`).

```dotenv
APP_NAME=next-template-reverb
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://ws.next.maktechlaravel.cloud

DB_CONNECTION=sqlite
SESSION_DRIVER=array
CACHE_STORE=array
QUEUE_CONNECTION=sync

REVERB_APP_ID=<same>
REVERB_APP_KEY=<same>
REVERB_APP_SECRET=<same>

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_HOST=ws.next.maktechlaravel.cloud
REVERB_PORT=443
REVERB_SCHEME=https

# Bare hostnames of the Next.js app only (not the WS host)
REVERB_ALLOWED_ORIGINS=next-template-eta.vercel.app
```

Leave `APP_KEY` empty once: the entrypoint generates it. Or set a stable `base64:...` so it survives rebuilds.

Do **not** put spaces in `APP_NAME`. Coolify injects env unquoted; spaces previously crashed Dotenv (`unexpected whitespace at [next-template Reverb]`).

### 2) Coolify — `next-template-api`

```dotenv
APP_NAME=next-template-api
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.next.maktechlaravel.cloud

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=<same as reverb>
REVERB_APP_KEY=<same as reverb>
REVERB_APP_SECRET=<same as reverb>
REVERB_HOST=ws.next.maktechlaravel.cloud
REVERB_PORT=443
REVERB_SCHEME=https

FRONTEND_URL=https://next-template-eta.vercel.app
FRONTEND_URLS=https://next-template-eta.vercel.app
BFF_SECRET=<same as Next BFF_SECRET>

# Plus existing DB / Redis / Scout / etc.
```

Do **not** run `reverb:start` in this image.

### 3) Vercel — `next-template`

```dotenv
LARAVEL_API_URL=https://api.next.maktechlaravel.cloud
BFF_SECRET=<same as API>
SESSION_SECRET=<random>
NEXT_PUBLIC_SITE_URL=https://next-template-eta.vercel.app

NEXT_PUBLIC_REVERB_APP_KEY=<same as REVERB_APP_KEY>
NEXT_PUBLIC_REVERB_HOST=ws.next.maktechlaravel.cloud
NEXT_PUBLIC_REVERB_PORT=443
NEXT_PUBLIC_REVERB_SCHEME=https
```

Never set `REVERB_APP_SECRET` or `BFF_SECRET` as `NEXT_PUBLIC_*`. Redeploy after changing `NEXT_PUBLIC_*` (they are baked at build).

## Failure matrix

| Symptom | Likely cause |
|---------|----------------|
| Dotenv “unexpected whitespace” | Unquoted `APP_NAME` with spaces — use `next-template-reverb` |
| Healthcheck unhealthy, empty log | Reverb crash-loop (fix `.env` first); ensure `curl` in image |
| WS refused in browser | `REVERB_ALLOWED_ORIGINS` missing the Vercel hostname |
| Public ping fails | API `REVERB_*` mismatch or Reverb down |
| Private auth 401 | Session / `BFF_SECRET` / expired or revoked Sanctum token |
