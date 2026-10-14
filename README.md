# Next.js + Laravel Starter Template

A production-oriented starter: a Next.js 16 App Router frontend (acting as a
BFF — Backend-for-Frontend) talking to a separate Laravel 13 API over Sanctum,
with realtime via Reverb, SEO health scanning, media/HLS uploads, backups,
and an audit log already wired up.

This repo is the **Next.js app only**. The Laravel API and the Reverb
websocket server are separate git repositories — clone them wherever you
like on your machine; nothing in this repo assumes a fixed relative path to
either of them.

## Architecture at a glance

- **Next.js app** (this repo): renders the UI, holds the browser-facing
  session (encrypted httpOnly cookie), and proxies authenticated requests to
  the Laravel API with a shared `BFF_SECRET`. The browser never talks to the
  Laravel API directly.
- **Laravel API** (separate repo): owns the database, auth (Sanctum tokens,
  Fortify), SEO health scanning, media processing, backups, and the audit
  log.
- **Reverb** (separate repo, or run via `php artisan reverb:start` inside the
  API repo): broadcasts realtime events (audit screen updates, future
  notifications) to the browser via `laravel-echo`.

## Prerequisites

- Node.js 24+ and `pnpm` (see `packageManager` in `package.json`)
- A running instance of the companion Laravel API (see its own README) —
  needed for auth, admin screens, and anything that isn't a static page
- Redis, if you want realtime features locally (the API uses it for
  broadcasting/queues)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

See `.env.example` for the full, annotated list. At minimum for local dev:

| Variable | Purpose |
| --- | --- |
| `LARAVEL_API_URL` | Base URL of the running Laravel API (e.g. `http://127.0.0.1:8000`) |
| `BFF_SECRET` | Shared secret sent as `X-BFF-Secret`; must match `BFF_SECRET` on the API. Generate with `openssl rand -base64 32` |
| `SESSION_SECRET` | 32+ byte secret used to encrypt the session cookie. Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Public URL of this app, used for canonical/OG tags |

Everything else (Sentry, Reverb, CSP mode, security contact) is optional and
documented inline in `.env.example`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server (regenerates SVG icon components first) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier, write mode |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm test:auth` | Node's built-in test runner against the BFF auth routes |
| `pnpm test:svg` | Validates generated SVG icon components are in sync |

## Running the full stack locally

1. Clone and set up the Laravel API repo (its README covers `composer setup`
   / `php artisan app:install`, which creates the first admin user).
2. Start the API: `composer dev` inside the API repo (runs `serve`, queue
   workers, and Vite together).
3. In this repo: `pnpm dev`.
4. Log in at `/login` with the admin credentials created by
   `php artisan app:install`.

## Project layout notes

- `proxy.ts` — the BFF proxy/middleware layer that forwards authenticated
  requests to the Laravel API and handles locale/session concerns.
- `app/(admin)` — the admin shell (dashboard, SEO health, backups, audit,
  media, etc.).
- `components/ui/**` — byte-identical shadcn/registry components. Don't
  hand-edit these; regenerate via the shadcn MCP/CLI instead.
- `components/svg/generated/**` — auto-generated from `assets/svg/**` via
  `pnpm svg:generate`. Don't hand-edit; the source SVGs live in `assets/svg`.

## Using this as a template for a new project

1. Rename the `name` field in `package.json`.
2. Replace the logo assets under `assets/svg/` and regenerate with
   `pnpm svg:generate`.
3. Set `NEXT_PUBLIC_SITE_URL`, `SEO_PRIMARY_ORIGIN`, and `SECURITY_CONTACT`
   for the new domain.
4. Point `LARAVEL_API_URL` at your clone of the companion API repo (see that
   repo's README for its own one-time setup).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
