import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import {
  decrypt,
  SESSION_COOKIE,
  SESSION_OVERRIDE_HEADER,
} from "@/lib/auth/session";
import {
  buildRefreshedSession,
  encryptSessionCookie,
  needsAccessTokenRefresh,
  sessionCookieOptions,
} from "@/lib/auth/session-refresh";
import type { SessionPayload } from "@/types/auth";

async function tryWriteSessionCookie(value: string, sessionEndsAt?: number): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, value, sessionCookieOptions(sessionEndsAt));
    return true;
  } catch {
    // Cookie writes are only allowed in Route Handlers / Server Actions.
    // Proxy refreshes (and Set-Cookie) cover RSC navigations.
    return false;
  }
}

async function tryDeleteSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Ignore when called from a Server Component render.
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const session = await encryptSessionCookie(payload);
  const written = await tryWriteSessionCookie(session, payload.sessionEndsAt);
  if (!written) {
    throw new Error(
      "Unable to write session cookie outside a mutable request context",
    );
  }
}

/** Per-request memoization so layout + page share one refresh. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  // Prefer the JWE proxy just minted for this request over a stale Cookie.
  const cookie =
    headerStore.get(SESSION_OVERRIDE_HEADER) ??
    cookieStore.get(SESSION_COOKIE)?.value;
  const session = await decrypt(cookie);

  if (!session) {
    return null;
  }

  if (!needsAccessTokenRefresh(session)) {
    return session;
  }

  if (!session.refreshToken) {
    await tryDeleteSessionCookie();
    return null;
  }

  const outcome = await buildRefreshedSession(session);

  if (outcome.status !== "refreshed") {
    // Refresh may already have run in proxy (token rotation). Keep a still
    // valid access token so RSC does not force-logout before Set-Cookie lands.
    if (outcome.status === "unavailable" && session.expiresAt > Date.now()) {
      return session;
    }

    // Deliberately no delete here. Cookie writes are illegal during a Server
    // Component render anyway, and a concurrent request may have rotated the
    // token and written a fresh cookie this one cannot see. Returning null
    // denies this request; the proxy and authedFetch handle the sign-out.
    return null;
  }

  const encrypted = await encryptSessionCookie(outcome.session);
  await tryWriteSessionCookie(encrypted, outcome.session.sessionEndsAt);
  return outcome.session;
});

export async function updateSession(
  payload: SessionPayload,
): Promise<SessionPayload | null> {
  await createSession(payload);
  return payload;
}

export async function deleteSession(): Promise<void> {
  await tryDeleteSessionCookie();
}
