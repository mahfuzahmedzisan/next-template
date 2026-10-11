"use client";

import { useCallback, useEffect, useState } from "react";

import type { AuditEntry } from "@/lib/admin/audit-types";
import { getEcho } from "@/lib/realtime/echo";

const CHANNEL = "admin.audit";

/**
 * Counts audit entries broadcast since the list was last loaded. The screen
 * offers to reload instead of inserting rows, so filters and paging stay exact.
 */
export function useAuditLive(enabled = true) {
  const [fresh, setFresh] = useState<AuditEntry[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(CHANNEL);
    channel.subscribed(() => setConnected(true));
    channel.error(() => setConnected(false));
    channel.listen(".activity.logged", (payload: unknown) => {
      const activity = (payload as { activity?: AuditEntry } | null)?.activity;
      if (!activity?.id) return;
      setFresh((current) =>
        current.some((entry) => entry.id === activity.id) ? current : [activity, ...current].slice(0, 100),
      );
    });

    return () => {
      echo.leave(`private-${CHANNEL}`);
      setConnected(false);
    };
  }, [enabled]);

  const clear = useCallback(() => setFresh([]), []);

  return { fresh, connected, clear };
}
