"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

import { isReverbConfigured, reverbPublicConfig } from "@/lib/realtime/config";

type EchoAuthorizerCallback = (
  error: Error | null,
  data: { auth: string } | null,
) => void;

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

let echo: Echo<"reverb"> | null = null;

export function getEcho(): Echo<"reverb"> | null {
  if (typeof window === "undefined" || !isReverbConfigured()) {
    return null;
  }

  if (echo) {
    return echo;
  }

  window.Pusher = Pusher;
  const config = reverbPublicConfig();

  echo = new Echo({
    broadcaster: "reverb",
    key: config.key,
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.useTls,
    enabledTransports: ["ws", "wss"],
    authorizer: (channel) => ({
      authorize: (socketId: string, callback: EchoAuthorizerCallback) => {
        void fetch("/api/broadcasting/auth", {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(async (response) => {
            const data = (await response.json()) as {
              auth?: string;
              message?: string;
            };

            if (!response.ok || !data.auth) {
              callback(
                new Error(data.message ?? "Broadcast auth failed"),
                null,
              );
              return;
            }

            callback(null, { auth: data.auth });
          })
          .catch((error: unknown) => {
            callback(
              error instanceof Error
                ? error
                : new Error("Broadcast auth failed"),
              null,
            );
          });
      },
    }),
  });

  return echo;
}

export function disconnectEcho(): void {
  echo?.disconnect();
  echo = null;
}

export function reconnectEcho(): Echo<"reverb"> | null {
  disconnectEcho();
  return getEcho();
}
