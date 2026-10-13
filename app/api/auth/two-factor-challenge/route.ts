import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/auth/api-error";
import { authErrorResponse } from "@/lib/auth/route-error";
import { requestTwoFactorChallenge } from "@/lib/auth/laravel-auth";
import { createSession } from "@/lib/auth/auth-cookies";
import {
  clearChallengeToken,
  readChallengeToken,
} from "@/lib/auth/two-factor-cookie";

const challengeSchema = z
  .object({
    code: z.string().optional(),
    recovery_code: z.string().optional(),
  })
  .refine((data) => Boolean(data.code || data.recovery_code), {
    message: "Enter your authenticator code or a recovery code.",
    path: ["code"],
  });

export async function POST(request: Request) {
  try {
    const challengeToken = await readChallengeToken();
    if (!challengeToken) {
      return NextResponse.json(
        { message: "Your sign-in attempt expired. Sign in again." },
        { status: 401 },
      );
    }

    const json = await request.json();
    const parsed = challengeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid challenge payload",
          errors: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const result = await requestTwoFactorChallenge({
      challenge_token: challengeToken,
      ...parsed.data,
    });

    await createSession({
      accessToken: result.access_token,
      sessionEndsAt: result.session_ends_at * 1000,
      user: result.user,
    });
    await clearChallengeToken();

    return NextResponse.json({ user: result.user });
  } catch (error) {
    if (error instanceof ApiError && challengeIsDead(error)) {
      await clearChallengeToken();
      return NextResponse.json(
        { message: "Your sign-in attempt expired. Sign in again." },
        { status: 401 },
      );
    }

    return authErrorResponse(error, "Two-factor verification failed");
  }
}

/** Expired, reused, or malformed challenge: retrying the code cannot succeed. */
function challengeIsDead(error: ApiError): boolean {
  if (error.status === 400) return true;
  const body = error.body as { errors?: Record<string, unknown> } | undefined;
  return error.status === 422 && Boolean(body?.errors?.challenge_token);
}
