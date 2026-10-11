import "server-only";

import { cookies } from "next/headers";

/**
 * The two-factor challenge token stays in an httpOnly cookie scoped to the
 * one route that redeems it, so page scripts never hold it.
 */
const TWO_FACTOR_COOKIE = "two_factor_challenge";
const TWO_FACTOR_COOKIE_PATH = "/api/auth/two-factor-challenge";
/** Matches `AuthController::CHALLENGE_TTL_MINUTES` in the Laravel API. */
const TWO_FACTOR_COOKIE_MAX_AGE = 5 * 60;

export async function storeChallengeToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: TWO_FACTOR_COOKIE_PATH,
    maxAge: TWO_FACTOR_COOKIE_MAX_AGE,
  });
}

export async function readChallengeToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TWO_FACTOR_COOKIE)?.value;
}

export async function clearChallengeToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: TWO_FACTOR_COOKIE_PATH,
    maxAge: 0,
  });
}
