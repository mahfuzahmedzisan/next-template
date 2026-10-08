import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { getSession } from "@/lib/auth/auth-cookies";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import { deleteAdminVideo, getAdminVideo, updateAdminVideo } from "@/lib/media/videos";

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
  const videoId = Number(id);
  return Number.isInteger(videoId) && videoId > 0 ? videoId : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const videoId = await idFrom(context.params);
  if (videoId === null) {
    return NextResponse.json({ message: "Video not found." }, { status: 404 });
  }

  try {
    const data = await getAdminVideo(videoId);
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error, "Unable to load the video.");
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

  const videoId = await idFrom(context.params);
  if (videoId === null) {
    return NextResponse.json({ message: "Video not found." }, { status: 404 });
  }

  let body: { title?: string };
  try {
    body = (await request.json()) as { title?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 422 });
  }

  try {
    const data = await updateAdminVideo(videoId, body.title ?? "");
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error, "Unable to update the video.");
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

  const videoId = await idFrom(context.params);
  if (videoId === null) {
    return NextResponse.json({ message: "Video not found." }, { status: 404 });
  }

  try {
    await deleteAdminVideo(videoId);
    return NextResponse.json({ message: "Video deleted successfully." });
  } catch (error) {
    return jsonError(error, "Unable to delete the video.");
  }
}
