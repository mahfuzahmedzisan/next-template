import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/auth-cookies";
import { laravelHttp } from "@/lib/auth/http";
import { logoutUrl } from "@/lib/auth/session-expired";

export const dynamic = "force-dynamic";

const SEO_PAGE = "/admin/application/seo";
const FILES = new Set(["sitemap", "robots", "llms"]);

/** Streams a generated SEO file from Laravel as an attachment for the signed-in admin. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/admin/seo/download/[file]">) {
  const { file } = await ctx.params;
  if (!FILES.has(file)) {
    return NextResponse.json({ message: "Unknown file." }, { status: 404 });
  }

  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.redirect(new URL(logoutUrl(SEO_PAGE), request.url));
  }

  let upstream;
  try {
    upstream = await laravelHttp.get<string>(`/admin/seo/files/${file}/download`, {
      headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "*/*" },
      responseType: "text",
      timeout: 30_000,
      signal: request.signal,
    });
  } catch {
    return NextResponse.json({ message: "The SEO service is unavailable." }, { status: 502 });
  }

  if (upstream.status === 401) {
    return NextResponse.redirect(new URL(logoutUrl(SEO_PAGE), request.url));
  }

  if (upstream.status !== 200) {
    return NextResponse.json({ message: "This file is not available." }, { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers({
    "content-type": String(upstream.headers["content-type"] ?? "text/plain; charset=utf-8"),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  const disposition = upstream.headers["content-disposition"];
  if (typeof disposition === "string") headers.set("content-disposition", disposition);

  return new Response(upstream.data, { status: 200, headers });
}
