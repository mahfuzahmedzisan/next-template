import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { getSession } from "@/lib/auth/auth-cookies";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import { deleteAdminMedia, getAdminMedia, updateAdminMedia } from "@/lib/media/library";

function jsonError(error: unknown, fallback: string) {
  if (error instanceof SessionExpiredError) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status || 500 },
    );
  }

  return NextResponse.json({ message: fallback }, { status: 500 });
}

async function idFrom(params: Promise<{ id: string }>) {
  const { id } = await params;
  const mediaId = Number(id);
  return Number.isInteger(mediaId) && mediaId > 0 ? mediaId : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const mediaId = await idFrom(context.params);
  if (mediaId === null) {
    return NextResponse.json({ message: "Media not found." }, { status: 404 });
  }

  try {
    const data = await getAdminMedia(mediaId);
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error, "Unable to load the media item.");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const mediaId = await idFrom(context.params);
  if (mediaId === null) {
    return NextResponse.json({ message: "Media not found." }, { status: 404 });
  }

  let body: { title?: string; slug?: string; alt?: string | null; keywords?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 422 });
  }

  try {
    const data = await updateAdminMedia(mediaId, {
      title: body.title ?? "",
      slug: body.slug ?? "",
      alt: body.alt,
      keywords: body.keywords,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error, "Unable to update the media item.");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const mediaId = await idFrom(context.params);
  if (mediaId === null) {
    return NextResponse.json({ message: "Media not found." }, { status: 404 });
  }

  try {
    await deleteAdminMedia(mediaId);
    return NextResponse.json({ message: "Media deleted successfully." });
  } catch (error) {
    return jsonError(error, "Unable to delete the media item.");
  }
}
