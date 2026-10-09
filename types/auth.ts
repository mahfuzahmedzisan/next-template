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
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  /** Absolute sign-in deadline in ms. Missing on cookies issued before Remember me. */
  sessionEndsAt?: number;
  user: User;
};

export type LaravelTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  /** Unix seconds. Present on login, register, and two-factor completion. */
  session_ends_at?: number;
};

/** Returned by /auth/login when the account has 2FA enabled, instead of a token pair. */
export type TwoFactorChallengeResponse = {
  two_factor: true;
  challenge_token: string;
};
