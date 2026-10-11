import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import type { SessionPayload } from "@/types/auth";

export const SESSION_COOKIE = "session";

/**
 * The session cookie is a JWE (encrypted), not just a signed JWT: anyone who
 * can read cookies off disk or a request log sees ciphertext, never the raw
 * access token or user data. `dir`/`A256GCM` is direct symmetric
 * encryption with AES-256-GCM, which is authenticated (tamper-evident) by
 * construction - there is no separate "sign" step to bolt on, the GCM tag
 * already proves integrity, so this satisfies encrypt *and* authenticate in
 * a single primitive instead of the old sign-only (HS256) approach.
 */
function getEncryptionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  // SHA-256 guarantees exactly 32 bytes regardless of the configured secret's
  // raw length, which is what A256GCM requires as a content-encryption key.
  return new Uint8Array(createHash("sha256").update(secret).digest());
}

function tryGetEncryptionKey(): Uint8Array | null {
  try {
    return getEncryptionKey();
  } catch {
    return null;
  }
}

export function sessionHasEnded(
  session: Pick<SessionPayload, "sessionEndsAt">,
  now = Date.now(),
): boolean {
  return session.sessionEndsAt <= now;
}

/** The cookie dies with the Sanctum token, so neither outlives the other. */
export function sessionCookieOptions(sessionEndsAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(sessionEndsAt),
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.sessionEndsAt))
    .encrypt(getEncryptionKey());
}

export async function decrypt(
  session: string | undefined,
): Promise<SessionPayload | null> {
  if (!session) {
    return null;
  }

  const key = tryGetEncryptionKey();
  if (!key) {
    return null;
  }

  try {
    const { payload } = await jwtDecrypt(session, key, {
      contentEncryptionAlgorithms: ["A256GCM"],
      keyManagementAlgorithms: ["dir"],
    });

    const { accessToken, sessionEndsAt, user } = payload;

    if (
      typeof accessToken !== "string" ||
      typeof sessionEndsAt !== "number" ||
      !user ||
      typeof user !== "object"
    ) {
      return null;
    }

    return {
      accessToken,
      sessionEndsAt,
      user: user as SessionPayload["user"],
    };
  } catch {
    return null;
  }
}

/** Cookie-only check for the proxy: JWE decrypts and looks like a live session. */
export function sessionLooksAuthenticated(
  session: SessionPayload | null,
): boolean {
  if (!session?.accessToken || !session.user?.id) return false;
  return !sessionHasEnded(session);
}
