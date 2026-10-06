import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_OVERRIDE_HEADER,
  decrypt,
  sessionLooksAuthenticated,
} from "@/lib/auth/session";
import { SESSION_EXPIRED_REASON } from "@/lib/auth/session-expired";
import { runWithFrontendOrigin } from "@/lib/auth/frontend-origin-store";
import {
  buildRefreshedSession,
  encryptSessionCookie,
  needsAccessTokenRefresh,
  sessionCookieOptions,
} from "@/lib/auth/session-refresh";

/**
 * Proxy (Next.js 16's replacement for middleware.ts) only does the
 * *optimistic* check: does a cookie exist that looks like a live session?
 * It is not the authorization boundary - every Server Component, Server
 * Action, and Route Handler that touches the Laravel API re-verifies via
 * `getSession()`/`authedRequest()`, which can hit a 401 and revoke/redirect
 * on its own. This keeps Proxy fast and avoids the anti-pattern of treating
 * it as a full session store.
 */
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

function nextWithRequest(request: NextRequest, requestHeaders: Headers) {
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function proxy(request: NextRequest) {
  const origin =
    request.headers.get("origin") ?? request.nextUrl.origin;

  return runWithFrontendOrigin(origin, () => handleProxy(request));
}

async function handleProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthOnlyPage = AUTH_ONLY_PATHS.includes(pathname);

  if (!isAdmin && !isAuthOnlyPage) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  let session = await decrypt(cookie);
  let refreshedCookieValue: string | null = null;
  let clearedSession = false;

  // Never trust a client-supplied override; only proxy may mint one.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(SESSION_OVERRIDE_HEADER);

  // Persist silent refresh before RSC runs (cookie writes are illegal in RSC).
  if (session && needsAccessTokenRefresh(session)) {
    const outcome = await buildRefreshedSession(session);

    if (outcome.status === "refreshed") {
      refreshedCookieValue = await encryptSessionCookie(outcome.session);
      request.cookies.set(SESSION_COOKIE, refreshedCookieValue);
      requestHeaders.set(SESSION_OVERRIDE_HEADER, refreshedCookieValue);
      session = outcome.session;
    } else if (outcome.status === "revoked") {
      request.cookies.delete(SESSION_COOKIE);
      session = null;
      clearedSession = true;
    }
    // "unavailable" falls through untouched. The API being briefly
    // unreachable is not grounds for signing anyone out; the next request
    // tries again.
  }

  const authenticated = sessionLooksAuthenticated(session);

  if (isAdmin && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    if (clearedSession) {
      loginUrl.searchParams.set("reason", SESSION_EXPIRED_REASON);
    }
    const redirectResponse = NextResponse.redirect(loginUrl);
    if (clearedSession) {
      redirectResponse.cookies.delete(SESSION_COOKIE);
    }
    return redirectResponse;
  }

  if (isAuthOnlyPage && authenticated) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    const redirectResponse = NextResponse.redirect(adminUrl);
    if (refreshedCookieValue) {
      redirectResponse.cookies.set(
        SESSION_COOKIE,
        refreshedCookieValue,
        sessionCookieOptions(),
      );
    }
    return redirectResponse;
  }

  const response = nextWithRequest(request, requestHeaders);
  if (refreshedCookieValue) {
    response.cookies.set(
      SESSION_COOKIE,
      refreshedCookieValue,
      sessionCookieOptions(),
    );
  } else if (clearedSession) {
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
