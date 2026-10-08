import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import type { SessionPayload } from "@/types/auth";

export const SESSION_COOKIE = "session";

/**
 * Proxy → RSC handoff after a silent refresh. Never accepted from the browser:
 * proxy strips any inbound value and only sets one it just minted.
 */
export const SESSION_OVERRIDE_HEADER = "x-mahfuz-session";

/** Remember me. Idle time inside this window still refreshes the access token. */
export const REMEMBER_SESSION_MS = 1000 * 60 * 60 * 24 * 30;

/** Sign-in without Remember me. */
export const BROWSER_SESSION_MS = 1000 * 60 * 60 * 12;

/** Keep the httpOnly cookie alive longer than the access token so silent refresh can run. */
export const SESSION_COOKIE_MAX_AGE_MS = REMEMBER_SESSION_MS;

/** Refresh access token when fewer than this many ms remain. */
export const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;

/**
 * The session cookie is a JWE (encrypted), not just a signed JWT: anyone who
 * can read cookies off disk or a request log sees ciphertext, never the raw
 * access/refresh tokens or user data. `dir`/`A256GCM` is direct symmetric
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
  return typeof session.sessionEndsAt === "number" && session.sessionEndsAt <= now;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  const cookieExpires = new Date(
    payload.sessionEndsAt ?? Date.now() + SESSION_COOKIE_MAX_AGE_MS,
  );

  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(cookieExpires)
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

    const accessToken = payload.accessToken;
    const expiresAt = payload.expiresAt;
    const user = payload.user;

    if (
      typeof accessToken !== "string" ||
      typeof expiresAt !== "number" ||
      !user ||
      typeof user !== "object"
    ) {
      return null;
    }

    return {
      accessToken,
      refreshToken:
        typeof payload.refreshToken === "string"
          ? payload.refreshToken
          : undefined,
      expiresAt,
      sessionEndsAt:
        typeof payload.sessionEndsAt === "number" ? payload.sessionEndsAt : undefined,
      user: user as SessionPayload["user"],
    };
  } catch {
    return null;
  }
}

/** Cookie-only check for the proxy: JWE decrypts and looks like a session. */
export function sessionLooksAuthenticated(
  session: SessionPayload | null,
): boolean {
  if (!session?.accessToken || !session.user?.id) return false;
  if (sessionHasEnded(session)) return false;
  // Cookie may outlive access token; silent refresh runs in proxy / getSession.
  if (session.refreshToken) return true;
  return session.expiresAt > Date.now();
}
