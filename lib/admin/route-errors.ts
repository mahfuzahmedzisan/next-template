import "server-only";

import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { SessionExpiredError } from "@/lib/auth/session-expired";

export function auditJsonError(error: unknown, fallback: string) {
  if (error instanceof SessionExpiredError) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  // A 5xx message can carry an exception or SQL text from Laravel, so only 4xx text is passed on.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ message: fallback }, { status: error.status || 500 });
  }

  return NextResponse.json({ message: fallback }, { status: 500 });
}
