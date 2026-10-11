import "server-only";

import { laravelHttp, toApiError, unwrapOrThrow } from "@/lib/auth/http";
import type {
  LaravelTokenResponse,
  TwoFactorChallengeResponse,
  User,
} from "@/types/auth";

/**
 * Calls the Laravel API's `/api/v1/auth/*` endpoints with the end user's
 * credentials or an opaque two-factor challenge token. Laravel answers with a
 * Sanctum personal access token, which only ever lives in the encrypted
 * httpOnly session cookie.
 */

export type TokenEnvelope = LaravelTokenResponse & { user: User };

export type LoginResult = TokenEnvelope | TwoFactorChallengeResponse;

export function isTwoFactorChallenge(
  data: LoginResult,
): data is TwoFactorChallengeResponse {
  return (data as TwoFactorChallengeResponse).two_factor === true;
}

export async function requestLogin(input: {
  email: string;
  password: string;
  remember?: boolean;
}): Promise<LoginResult> {
  try {
    const response = await laravelHttp.post("/auth/login", input);
    return unwrapOrThrow<LoginResult>(response);
  } catch (error) {
    throw toApiError(error, "Login failed");
  }
}

export async function requestTwoFactorChallenge(input: {
  challenge_token: string;
  code?: string;
  recovery_code?: string;
}): Promise<TokenEnvelope> {
  try {
    const response = await laravelHttp.post(
      "/auth/two-factor-challenge",
      input,
    );
    return unwrapOrThrow<TokenEnvelope>(response);
  } catch (error) {
    throw toApiError(error, "Two-factor verification failed");
  }
}

export async function requestRegister(input: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<TokenEnvelope> {
  try {
    const response = await laravelHttp.post("/auth/register", input);
    return unwrapOrThrow<TokenEnvelope>(response);
  } catch (error) {
    throw toApiError(error, "Registration failed");
  }
}

export async function requestForgotPassword(input: {
  email: string;
}): Promise<{ message: string }> {
  try {
    const response = await laravelHttp.post("/auth/forgot-password", input);
    unwrapOrThrow<null>(response);
    return { message: response.data?.message ?? "Reset link sent." };
  } catch (error) {
    throw toApiError(error, "Unable to send password reset link");
  }
}

export async function requestResetPassword(input: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  try {
    const response = await laravelHttp.post("/auth/reset-password", input);
    unwrapOrThrow<null>(response);
    return { message: response.data?.message ?? "Password reset." };
  } catch (error) {
    throw toApiError(error, "Unable to reset password");
  }
}