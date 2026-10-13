import "server-only";

import { NextResponse } from "next/server";

/** Multipart boundaries and the other form fields. */
const FORM_OVERHEAD_BYTES = 64 * 1024;

/**
 * Rejects an upload before `request.formData()` buffers it into memory.
 * A missing or chunked Content-Length is refused too, since the size can't be known up front.
 */
export function rejectOversizedBody(request: Request, maxFileBytes: number): NextResponse | null {
  const header = request.headers.get("content-length");
  const length = header === null ? Number.NaN : Number(header);

  if (!Number.isFinite(length) || length < 0) {
    return NextResponse.json({ message: "The upload size is missing." }, { status: 411 });
  }

  if (length > maxFileBytes + FORM_OVERHEAD_BYTES) {
    return NextResponse.json({ message: "This file is larger than the upload limit." }, { status: 413 });
  }

  return null;
}
