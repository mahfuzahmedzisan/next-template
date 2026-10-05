import "server-only";

import axios, { AxiosError } from "axios";
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
  timeout: 10_000,
  validateStatus: () => true, // We inspect status ourselves; never throw on non-2xx here.
});

laravelHttp.interceptors.request.use(async (config) => {
  const secret = process.env.BFF_SECRET;
  if (!secret) {
    throw new Error("BFF_SECRET environment variable is not set");
  }

  config.headers.set("X-BFF-Secret", secret);
  config.headers.set("X-Frontend-Origin", await resolveFrontendOrigin());

  return config;
});

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
