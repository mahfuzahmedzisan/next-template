export type UserRole = "admin" | "user";

export type ThemePreference = "light" | "dark" | "system";

export type User = {
  id: string | number;
  name: string;
  email: string;
  avatar?: string | null;
  role: UserRole;
  two_factor_enabled: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  theme?: ThemePreference;
  timezone?: string | null;
};

/** Encrypted into the httpOnly session cookie. Never sent to the browser as JS-readable JSON. */
export type SessionPayload = {
  /** Sanctum personal access token. Laravel rejects it after `sessionEndsAt`. */
  accessToken: string;
  /** Absolute sign-in deadline in ms: 12 hours, or 30 days with Remember me. */
  sessionEndsAt: number;
  user: User;
};

export type LaravelTokenResponse = {
  access_token: string;
  token_type: string;
  /** Unix seconds. Matches the token's `expires_at` in Laravel. */
  session_ends_at: number;
};

/** Returned by /auth/login when the account has 2FA enabled, instead of a token pair. */
export type TwoFactorChallengeResponse = {
  two_factor: true;
  challenge_token: string;
};
