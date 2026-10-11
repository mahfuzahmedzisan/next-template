import assert from "node:assert/strict";
import test from "node:test";

import { sessionHasEnded, sessionLooksAuthenticated } from "../../lib/auth/session.ts";
import type { SessionPayload } from "../../types/auth.ts";

function session(sessionEndsAt: number): SessionPayload {
  return {
    accessToken: "1|token",
    sessionEndsAt,
    user: {
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
      two_factor_enabled: false,
    },
  };
}

test("a session past its deadline is signed out", () => {
  assert.equal(sessionHasEnded({ sessionEndsAt: Date.now() - 1 }), true);
  assert.equal(sessionLooksAuthenticated(session(Date.now() - 1)), false);
});

test("a session inside its deadline stays signed in", () => {
  const ends = Date.now() + 1000 * 60 * 60;
  assert.equal(sessionHasEnded({ sessionEndsAt: ends }), false);
  assert.equal(sessionLooksAuthenticated(session(ends)), true);
});

test("a missing session is not authenticated", () => {
  assert.equal(sessionLooksAuthenticated(null), false);
});
