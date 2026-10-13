import { Readable } from "node:stream";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/auth-cookies";
import { laravelHttp } from "@/lib/auth/http";
import { logoutUrl } from "@/lib/auth/session-expired";

export const dynamic = "force-dynamic";

const BACKUP_PAGE = "/admin/application/backup";

/**
 * The browser navigates here with a one-time token from `downloadBackupAction`.
 * The archive streams from Laravel through this handler, so neither the token
 * nor the Sanctum token ever reaches the API from the browser.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!/^[A-Za-z0-9]{64}$/.test(token)) {
    return backToPage(request, "This download link is not valid.");
  }

  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.redirect(new URL(logoutUrl(BACKUP_PAGE), request.url));
  }

  let upstream;
  try {
    upstream = await laravelHttp.get<Readable>(`/admin/backups/download/${token}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/zip, application/json",
      },
      responseType: "stream",
      // Socket-idle timeout: a long archive keeps streaming, a stalled API gives up.
      timeout: 120_000,
      signal: request.signal,
    });
  } catch {
    return backToPage(request, "The backup service is unavailable.");
  }

  if (upstream.status === 401) {
    upstream.data.destroy();
    return NextResponse.redirect(new URL(logoutUrl(BACKUP_PAGE), request.url));
  }

  if (upstream.status !== 200) {
    upstream.data.destroy();
    return backToPage(request, "This download link has expired. Try again.");
  }

  const headers = new Headers({
    "content-type": "application/zip",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  for (const name of ["content-disposition", "content-length"]) {
    const value = upstream.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }

  return new Response(Readable.toWeb(upstream.data) as ReadableStream, {
    status: 200,
    headers,
  });
}

function backToPage(request: NextRequest, message: string) {
  const url = new URL(BACKUP_PAGE, request.url);
  url.searchParams.set("download_error", message);
  return NextResponse.redirect(url, 303);
}
