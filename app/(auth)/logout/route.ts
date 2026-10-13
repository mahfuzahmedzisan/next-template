import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { revokeLaravelToken } from "@/lib/auth/api";
import { deleteSession, getSession } from "@/lib/auth/auth-cookies";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { SESSION_EXPIRED_REASON } from "@/lib/auth/session-expired";

/**
 * The single exit for a session that can no longer be used.
 *
 * A Server Component cannot delete a cookie, so code that discovers a dead
 * session mid-render redirects here instead. This route sits outside the
 * proxy matcher on purpose: the cookie is gone by the time the browser
 * follows on to /login, so there is nothing left for the proxy to mistake
 * for a live session and bounce back to /admin.
 */
export async function GET(request: NextRequest) {
  // Server redirects land here same-origin. A cross-site link or <img> must
  // not be able to sign the visitor out, so it only gets the login redirect.
  const crossSite = request.headers.get("sec-fetch-site") === "cross-site";

  if (!crossSite) {
    const session = await getSession().catch(() => null);

    if (session?.accessToken) {
      // Best effort. When the token is already dead - the usual reason for
      // landing here - this simply fails and is ignored.
      await revokeLaravelToken(session.accessToken);
    }

    await deleteSession();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  const next = request.nextUrl.searchParams.get("next");
  const reason = request.nextUrl.searchParams.get("reason");
  const safeNext = next ? safeRedirectPath(next, "") : "";

  if (safeNext) loginUrl.searchParams.set("next", safeNext);
  if (reason === SESSION_EXPIRED_REASON) {
    loginUrl.searchParams.set("reason", SESSION_EXPIRED_REASON);
  }

  const response = NextResponse.redirect(loginUrl);
  if (!crossSite) response.cookies.delete(SESSION_COOKIE);
  return response;
}
