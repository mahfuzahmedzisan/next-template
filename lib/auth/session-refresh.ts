import "server-only";

import { ApiError } from "@/lib/auth/api-error";
import { refreshAccessToken } from "@/lib/auth/passport-tokens";
import {
  ACCESS_TOKEN_REFRESH_SKEW_MS,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE_MS,
  encrypt,
  sessionHasEnded,
} from "@/lib/auth/session";
import type { SessionPayload } from "@/types/auth";

/**
 * A failed refresh means one of two very different things, and conflating
 * them is how a thirty second backend hiccup turns into every user being
 * signed out. "revoked" is proof the token is gone for good; "unavailable"
 * is not proof of anything and the session should be left alone.
 */
export type RefreshOutcome =
  | { status: "refreshed"; session: SessionPayload }
  | { status: "revoked" }
  | { status: "unavailable" };

/**
 * Passport revokes the refresh token as a "ValidationException" (422) for a
 * dead/already-used refresh token; 400/401 cover a malformed or rejected
 * grant. Anything else (5xx, network) is treated as transient.
 */
const REVOKED_STATUSES = new Set([400, 401, 422]);

export function needsAccessTokenRefresh(session: SessionPayload): boolean {
  return session.expiresAt <= Date.now() + ACCESS_TOKEN_REFRESH_SKEW_MS;
}

export function sessionCookieOptions(sessionEndsAt?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(sessionEndsAt ?? Date.now() + SESSION_COOKIE_MAX_AGE_MS),
    sameSite: "lax" as const,
    path: "/",
  };
}

/**
 * Passport revokes a refresh token the moment it is used, so two requests
 * that present the same one leave the loser with a dead session. Sharing one
 * in-flight promise per token keeps concurrent refreshes (layout + page,
 * parallel route handlers) down to a single exchange.
 *
 * This holds for a single Node process. Behind multiple instances the same
 * race remains possible and would need a shared store or a grace window.
 */
const inFlight = new Map<string, Promise<RefreshOutcome>>();

export async function buildRefreshedSession(
  session: SessionPayload,
): Promise<RefreshOutcome> {
  if (sessionHasEnded(session)) {
    return { status: "revoked" };
  }

  const { refreshToken } = session;
  if (!refreshToken) {
    return { status: "revoked" };
  }

  const existing = inFlight.get(refreshToken);
  if (existing) {
    return existing;
  }

  const pending = exchangeRefreshToken(session, refreshToken).finally(() => {
    inFlight.delete(refreshToken);
  });

  inFlight.set(refreshToken, pending);
  return pending;
}

async function exchangeRefreshToken(
  session: SessionPayload,
  refreshToken: string,
): Promise<RefreshOutcome> {
  try {
    const token = await refreshAccessToken(refreshToken);
    return {
      status: "refreshed",
      session: {
        ...session,
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? refreshToken,
        expiresAt: Date.now() + token.expires_in * 1000,
      },
    };
  } catch (error) {
    if (error instanceof ApiError && REVOKED_STATUSES.has(error.status)) {
      return { status: "revoked" };
    }

    return { status: "unavailable" };
  }
}

export async function encryptSessionCookie(
  session: SessionPayload,
): Promise<string> {
  return encrypt(session);
}

export { SESSION_COOKIE };
