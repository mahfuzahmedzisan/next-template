/**
 * Shared vocabulary for "this session is dead and the user must sign in again".
 *
 * Deliberately free of server-only imports: the proxy, route handlers,
 * Server Components, and browser code all need to agree on these values.
 */

import type { Route } from "next";

/** Query flag that tells the login page why the visitor landed there. */
export const SESSION_EXPIRED_REASON = "session-expired";

/**
 * Clearing the cookie requires a mutable request context, which a Server
 * Component render is not. Sending the user through this route handler gets
 * the cookie deleted before they reach the login page - without it the proxy
 * would still see a valid-looking session and bounce them straight back.
 */
export const LOGOUT_PATH = "/logout";

/** Raised when the API rejects our token and the refresh cannot revive it. */
export class SessionExpiredError extends Error {
  constructor(message = "Your session has expired.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export function logoutUrl(next?: string): Route {
  const params = new URLSearchParams({ reason: SESSION_EXPIRED_REASON });
  if (next) params.set("next", next);
  return `${LOGOUT_PATH}?${params.toString()}` as Route;
}
