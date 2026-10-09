import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { getSession } from "@/lib/auth/auth-cookies";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import { createAdminMedia, listAdminMedia } from "@/lib/media/library";

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

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const perPage = url.searchParams.get("per_page")?.trim() || "24";
  const params = new URLSearchParams({ per_page: perPage });
  const q = url.searchParams.get("q")?.trim();
  const kind = url.searchParams.get("kind")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const page = url.searchParams.get("page")?.trim();
  if (q) params.set("filter[q]", q);
  if (kind && kind !== "all") params.set("filter[kind]", kind);
  if (status) params.set("filter[status]", status);
  if (page) params.set("page", page);

  try {
    const data = await listAdminMedia(params.toString(), "throw");
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error, "Unable to load media.");
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  let body: {
    title?: string;
    slug?: string;
    filename?: string;
    size?: number;
    mime?: string;
    alt?: string;
    keywords?: string[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 422 });
  }

  try {
    const data = await createAdminMedia({
      title: body.title ?? "",
      slug: body.slug,
      filename: body.filename ?? "",
      size: Number(body.size ?? 0),
      mime: body.mime ?? "",
      alt: body.alt,
      keywords: body.keywords,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Unable to start the upload.");
  }
}
