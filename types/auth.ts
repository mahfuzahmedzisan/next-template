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
};

/** Encrypted into the httpOnly session cookie. Never sent to the browser as JS-readable JSON. */
export type SessionPayload = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: User;
};

export type LaravelTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

/** Returned by /auth/login when the account has 2FA enabled, instead of a token pair. */
export type TwoFactorChallengeResponse = {
  two_factor: true;
  challenge_token: string;
};
