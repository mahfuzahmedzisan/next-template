import "server-only";

import axios, { AxiosError } from "axios";
import { headers } from "next/headers";
import { ApiError } from "@/lib/auth/api-error";
import { resolveFrontendOrigin } from "@/lib/auth/frontend-origin";

function getApiBaseUrl(): string {
  const base = process.env.LARAVEL_API_URL;
  if (!base) {
    throw new Error("LARAVEL_API_URL environment variable is not set");
  }
  return base.replace(/\/$/, "");
}

/**
 * The only HTTP client this BFF uses to talk to the Laravel API. Never
 * exposed to the browser - every import site is `server-only`. Axios (per
 * the plan) rather than bare `fetch`, so request/response handling,
 * interceptors, and error shaping stay in one place.
 */
export const laravelHttp = axios.create({
  baseURL: `${getApiBaseUrl()}/api/v1`,
  headers: { Accept: "application/json" },
  // `php artisan serve` handles one request at a time and its first request
  // after idling can exceed 10s, so local dev gets more headroom.
  timeout:
    Number(process.env.LARAVEL_API_TIMEOUT_MS) ||
    (process.env.NODE_ENV === "production" ? 10_000 : 30_000),
  validateStatus: () => true, // We inspect status ourselves; never throw on non-2xx here.
});

laravelHttp.interceptors.request.use(async (config) => {
  const secret = process.env.BFF_SECRET;
  if (!secret) {
    throw new Error("BFF_SECRET environment variable is not set");
  }

  config.headers.set("X-BFF-Secret", secret);
  config.headers.set("X-Frontend-Origin", await resolveFrontendOrigin());

  const client = await browserClient();
  if (client.ip) config.headers.set("X-Client-IP", client.ip);
  if (client.userAgent) config.headers.set("X-Client-User-Agent", client.userAgent);

  return config;
});

/**
 * Laravel keys its rate limiters and device history on this IP. The left-most
 * X-Forwarded-For entry is whatever the client typed, so the proxy-set headers
 * win and XFF falls back to its right-most (last proxy appended) entry.
 */
async function browserClient(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const headerStore = await headers();
    const forwarded = headerStore
      .get("x-forwarded-for")
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const ip =
      headerStore.get("x-real-ip")?.trim() ||
      headerStore.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      forwarded?.at(-1) ||
      null;
    return { ip, userAgent: headerStore.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export { getApiBaseUrl };

type LaravelEnvelope<T> = {
  message?: string;
  data?: T;
};

/**
 * Unwraps this API's `{ message, data }` envelope and turns any non-2xx
 * response into an `ApiError` carrying the original status and body, so
 * callers can branch on `error.status` the same way they would with `fetch`.
 */
export function unwrapOrThrow<T>(response: {
  status: number;
  data: LaravelEnvelope<T> | null;
}): T {
  if (response.status >= 200 && response.status < 300) {
    return response.data?.data as T;
  }

  throw new ApiError(
    response.data?.message ?? "Request to the authentication service failed.",
    response.status,
    response.data,
  );
}

export function toApiError(error: unknown, fallbackMessage: string): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    return new ApiError(
      (error.response?.data as { message?: string } | undefined)?.message ??
        fallbackMessage,
      error.response?.status ?? 500,
      error.response?.data,
    );
  }

  return new ApiError(fallbackMessage, 500);
}
