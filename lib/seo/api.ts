import "server-only";

/**
 * Fetch for the public SEO endpoints. Unlike `laravelHttp` it never reads
 * `headers()` or `cookies()`, so pages that use it can still be cached, and
 * it sends one fixed trusted origin instead of the visitor's.
 */
export class SeoFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "SeoFetchError";
  }
}

function apiBase(): string {
  const base = process.env.LARAVEL_API_URL;
  if (!base) throw new SeoFetchError("LARAVEL_API_URL is not set", 500);
  return `${base.replace(/\/$/, "")}/api/v1`;
}

/** Only the X-Frontend-Origin trust header; URLs in metadata come from the backend `site_url`. */
export function seoPrimaryOrigin(): string {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  for (const value of [
    process.env.SEO_PRIMARY_ORIGIN,
    process.env.NEXT_PUBLIC_SITE_URL,
    vercelProduction ? `https://${vercelProduction}` : undefined,
  ]) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
    } catch {
      // try the next one
    }
  }
  return "http://localhost:3000";
}

/** Loopback, `.localhost`/`.local` and private IPv4 hosts. */
export function isLocalOrigin(origin: string): boolean {
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase().replace(/^\[|\]$/g, "");
  } catch {
    return false;
  }
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/** A hung API must not hold a page render (or a build) open indefinitely. */
const SEO_FETCH_TIMEOUT_MS = 8_000;

/** Throws on any non-2xx response, so error bodies never reach the data cache. */
export async function seoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const secret = process.env.BFF_SECRET;
  if (!secret) throw new SeoFetchError("BFF_SECRET is not set", 500);

  const timeout = AbortSignal.timeout(SEO_FETCH_TIMEOUT_MS);
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    headers: {
      Accept: "application/json",
      ...init.headers,
      "X-BFF-Secret": secret,
      "X-Frontend-Origin": seoPrimaryOrigin(),
    },
  });

  if (!response.ok) {
    throw new SeoFetchError(`SEO request ${path} failed with ${response.status}`, response.status);
  }

  return response;
}
