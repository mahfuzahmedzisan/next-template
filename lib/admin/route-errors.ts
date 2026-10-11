import "server-only";

import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { SessionExpiredError } from "@/lib/auth/session-expired";

export function auditJsonError(error: unknown, fallback: string) {
  if (error instanceof SessionExpiredError) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status || 500 });
  }

  return NextResponse.json({ message: fallback }, { status: 500 });
}
