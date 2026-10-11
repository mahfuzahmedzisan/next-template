import "server-only";

import { isRedirectError } from "next/dist/client/components/redirect-error";

import { ApiError } from "@/lib/auth/api-error";
import { SessionExpiredError } from "@/lib/auth/session-expired";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export function toResult(error: unknown, fallback: string): ActionResult {
  // `redirect()` / session-expired navigation must not become a toast.
  if (isRedirectError(error) || error instanceof SessionExpiredError) {
    throw error;
  }

  if (error instanceof ApiError) {
    return { ok: false, message: error.message || fallback };
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: fallback };
}
