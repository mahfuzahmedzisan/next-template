"use server";

import { authedRequest } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/api-error";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type RealtimeActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type RealtimePingData = {
  channel: string;
  event: string;
  payload: {
    message: string;
    triggered_at: string;
    source: string;
  };
};

export type RealtimeHealthData = {
  broadcast_connection: string;
  host: string | null;
  port: number | string | null;
  scheme: string | null;
  app_key_preview: string | null;
};

export type RealtimePrivateData = {
  channel: string;
  event: string;
  payload: {
    message: string;
    triggered_at: string;
    user_id: number;
  };
};

function toResult(error: unknown, fallback: string): RealtimeActionResult<never> {
  if (isRedirectError(error) || error instanceof SessionExpiredError) {
    throw error;
  }

  if (error instanceof ApiError) {
    return { ok: false, message: error.message || fallback };
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: fallback };
}

export async function pingRealtimeAction(
  message: string,
): Promise<RealtimeActionResult<RealtimePingData>> {
  try {
    const data = await authedRequest<RealtimePingData>(
      "get",
      `/realtime/ping?message=${encodeURIComponent(message)}`,
    );
    return { ok: true, data };
  } catch (error) {
    return toResult(error, "Unable to dispatch public ping.");
  }
}

export async function privateRealtimeAction(): Promise<
  RealtimeActionResult<RealtimePrivateData>
> {
  try {
    const data = await authedRequest<RealtimePrivateData>(
      "post",
      "/realtime/test-notification",
    );
    return { ok: true, data };
  } catch (error) {
    return toResult(error, "Unable to dispatch private test.");
  }
}

export async function realtimeHealthAction(): Promise<
  RealtimeActionResult<RealtimeHealthData>
> {
  try {
    const data = await authedRequest<RealtimeHealthData>("get", "/realtime/health");
    return { ok: true, data };
  } catch (error) {
    return toResult(error, "Unable to read broadcasting config.");
  }
}
