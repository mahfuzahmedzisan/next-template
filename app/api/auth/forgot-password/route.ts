import { NextResponse } from "next/server";
import { z } from "zod";

import { authErrorResponse } from "@/lib/auth/route-error";
import { requestForgotPassword } from "@/lib/auth/laravel-auth";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const result = await requestForgotPassword(parsed.data);
    return NextResponse.json({ message: result.message });
  } catch (error) {
    return authErrorResponse(error, "Unable to send password reset link");
  }
}
