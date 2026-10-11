import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth-cookies";
import { ApiError } from "@/lib/auth/api-error";
import { laravelHttp, toApiError, unwrapOrThrow } from "@/lib/auth/http";
import { logoutUrl, SessionExpiredError } from "@/lib/auth/session-expired";
import type { User } from "@/types/auth";

export async function fetchLaravelUser(accessToken: string): Promise<User> {
  try {
    const response = await laravelHttp.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = unwrapOrThrow<{ user: User }>(response);
    return data.user;
  } catch (error) {
    throw toApiError(error, "Failed to fetch user");
  }
}

export async function revokeLaravelToken(accessToken: string): Promise<void> {
  try {
    await laravelHttp.post(
      "/auth/logout",
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  } catch {
    // Best-effort revoke; cookie will still be cleared locally.
  }
}

/**
 * What to do when the API rejects our token.
 *
 * Server Components and Server Actions want `redirect`, which navigates the
 * browser to the logout route. Route handlers want `throw`, so they can
 * answer their caller with JSON instead of a page of login HTML.
 */
type SessionExpiredBehavior = "redirect" | "throw";

function endSession(behavior: SessionExpiredBehavior): never {
  if (behavior === "redirect") {
    redirect(logoutUrl());
  }
  throw new SessionExpiredError();
}

/** Authenticated request to the Laravel API's `/profile/*` resources. */
export async function authedRequest<T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  path: string,
  body?: unknown,
  options: { onSessionExpired?: SessionExpiredBehavior } = {},
): Promise<T> {
  const { onSessionExpired = "redirect" } = options;

  const session = await getSession();
  if (!session?.accessToken) {
    endSession(onSessionExpired);
  }

  const send = (accessToken: string) => {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    return laravelHttp.request({
      method,
      url: path,
      data: body,
      headers: { Authorization: `Bearer ${accessToken}` },
      // Let axios set multipart boundary for FormData; JSON stays default.
      timeout: isFormData ? 30_000 : undefined,
    });
  };

  let response;
  try {
    response = await send(session.accessToken);
  } catch (error) {
    throw toApiError(error, "Unable to reach the API.");
  }

  // Sanctum tokens have no refresh grant: a 401 means the token expired or
  // was deleted (logout, password change/reset, account deletion).
  if (response.status === 401) {
    endSession(onSessionExpired);
  }

  if (response.status >= 200 && response.status < 300) {
    return response.data?.data as T;
  }

  throw new ApiError(
    response.data?.message ?? "API request failed",
    response.status,
    response.data,
  );
}

export { ApiError } from "@/lib/auth/api-error";
