import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/auth/api-error";
import { isTwoFactorChallenge, requestLogin } from "@/lib/auth/laravel-auth";
import { createSession } from "@/lib/auth/auth-cookies";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid credentials payload",
          errors: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const result = await requestLogin(parsed.data);

    if (isTwoFactorChallenge(result)) {
      // No session is created yet - the password has only been proven once,
      // sealed into the challenge token Laravel just returned. Nothing is
      // persisted client-side beyond that opaque, short-lived token.
      return NextResponse.json({
        two_factor: true,
        challenge_token: result.challenge_token,
      });
    }

    await createSession({
      accessToken: result.access_token,
      sessionEndsAt: result.session_ends_at * 1000,
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

    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
