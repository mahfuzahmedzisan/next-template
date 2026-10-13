import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { getSession } from "@/lib/auth/auth-cookies";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import { rejectOversizedBody } from "@/lib/http/body-limit";
import { uploadAdminMediaThumbnail } from "@/lib/media/library";

/** Matches StoreMediaThumbnailRequest (max:8192 KB) on the API. */
const THUMBNAIL_MAX_BYTES = 8 * 1024 * 1024;

function jsonError(error: unknown, fallback: string) {
  if (error instanceof SessionExpiredError) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  return NextResponse.json({ message: fallback }, { status: 500 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await context.params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId < 1) {
    return NextResponse.json({ message: "Media not found." }, { status: 404 });
  }

  const oversized = rejectOversizedBody(request, THUMBNAIL_MAX_BYTES);
  if (oversized) return oversized;

  const form = await request.formData();
  const thumbnail = form.get("thumbnail");
  if (!(thumbnail instanceof File)) {
    return NextResponse.json({ message: "A thumbnail image is required." }, { status: 422 });
  }

  try {
    const data = await uploadAdminMediaThumbnail(mediaId, thumbnail);
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error, "Unable to save the thumbnail.");
  }
}
