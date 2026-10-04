import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/auth/api-error";
import { requestRegister } from "@/lib/auth/passport-tokens";
import { createSession } from "@/lib/auth/auth-cookies";

const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid registration payload",
          errors: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const result = await requestRegister(parsed.data);

    await createSession({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: Date.now() + result.expires_in * 1000,
      user: result.user,
    });

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, details: error.body },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
