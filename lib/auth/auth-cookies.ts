import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import {
  decrypt,
  encrypt,
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionHasEnded,
} from "@/lib/auth/session";
import type { SessionPayload } from "@/types/auth";

async function tryWriteSessionCookie(value: string, sessionEndsAt: number): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, value, sessionCookieOptions(sessionEndsAt));
    return true;
  } catch {
    // Cookie writes are only allowed in Route Handlers / Server Actions.
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
  const session = await encrypt(payload);
  const written = await tryWriteSessionCookie(session, payload.sessionEndsAt);
  if (!written) {
    throw new Error(
      "Unable to write session cookie outside a mutable request context",
    );
  }
}

/** Per-request memoization so layout + page decrypt the cookie once. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return null;
  }

  if (sessionHasEnded(session)) {
    await tryDeleteSessionCookie();
    return null;
  }

  return session;
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
