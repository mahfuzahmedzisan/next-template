import "server-only";

import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";

/**
 * Shapes a failed auth call for the browser. Only Laravel's message and
 * validation field errors pass through for 4xx; a 5xx body or a local
 * exception message can carry stack, SQL or config text, so it never does.
 */
export function authErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    const body = (error.body ?? {}) as { message?: unknown; errors?: unknown };
    const message = typeof body.message === "string" ? body.message : error.message;
    const fieldErrors =
      body.errors && typeof body.errors === "object"
        ? (body.errors as Record<string, string[]>)
        : undefined;

    return NextResponse.json(
      {
        message,
        details: { message },
        ...(fieldErrors ? { errors: { fieldErrors } } : {}),
      },
      { status: error.status },
    );
  }

  const status = error instanceof ApiError && error.status >= 500 ? error.status : 500;
  return NextResponse.json({ message: fallback }, { status });
}
