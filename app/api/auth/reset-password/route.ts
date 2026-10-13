import { NextResponse } from "next/server";
import { z } from "zod";

import { authErrorResponse } from "@/lib/auth/route-error";
import { requestResetPassword } from "@/lib/auth/laravel-auth";

const schema = z
  .object({
    token: z.string().min(1),
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
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const result = await requestResetPassword(parsed.data);
    return NextResponse.json({ message: result.message });
  } catch (error) {
    return authErrorResponse(error, "Unable to reset password");
  }
}
