import { NextResponse } from "next/server";
import { z } from "zod";

import { authErrorResponse } from "@/lib/auth/route-error";
import { isTwoFactorChallenge, requestLogin } from "@/lib/auth/laravel-auth";
import { createSession } from "@/lib/auth/auth-cookies";
import { storeChallengeToken } from "@/lib/auth/two-factor-cookie";

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
      // No session yet. The opaque, short-lived challenge token goes into an
      // httpOnly cookie that only the two-factor route receives.
      await storeChallengeToken(result.challenge_token);
      return NextResponse.json({ two_factor: true });
    }

    await createSession({
      accessToken: result.access_token,
      sessionEndsAt: result.session_ends_at * 1000,
      user: result.user,
    });

    return NextResponse.json({ user: result.user });
  } catch (error) {
    return authErrorResponse(error, "Login failed");
  }
}
