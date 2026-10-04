import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/auth/api-error";
import { requestForgotPassword } from "@/lib/auth/passport-tokens";

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
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Unable to send password reset link" },
      { status: 500 },
    );
  }
}
