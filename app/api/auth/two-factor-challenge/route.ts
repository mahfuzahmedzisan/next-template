import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/auth/api-error";
import { requestTwoFactorChallenge } from "@/lib/auth/passport-tokens";
import { createSession } from "@/lib/auth/auth-cookies";

const challengeSchema = z
  .object({
    challenge_token: z.string().min(1),
    code: z.string().optional(),
    recovery_code: z.string().optional(),
  })
  .refine((data) => Boolean(data.code || data.recovery_code), {
    message: "Enter your authenticator code or a recovery code.",
    path: ["code"],
  });

export async function POST(request: Request) {
  try {
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

    const result = await requestTwoFactorChallenge(parsed.data);

    await createSession({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: Date.now() + result.expires_in * 1000,
      user: result.user,
    });

    return NextResponse.json({ user: result.user });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, details: error.body },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error ? error.message : "Two-factor verification failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
