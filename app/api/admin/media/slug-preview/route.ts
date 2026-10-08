import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { getSession } from "@/lib/auth/auth-cookies";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import { previewAdminMediaSlugs } from "@/lib/media/library";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const title = url.searchParams.get("title")?.trim() ?? "";
  const count = Number(url.searchParams.get("count") ?? "1");

  if (title === "") {
    return NextResponse.json({ data: { slugs: [] } });
  }

  try {
    const slugs = await previewAdminMediaSlugs(title, Number.isFinite(count) ? count : 1);
    return NextResponse.json({ data: { slugs } });
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status || 500 });
    }
    return NextResponse.json({ message: "Unable to prepare slugs." }, { status: 500 });
  }
}
