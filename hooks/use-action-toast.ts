"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ActionFeedback = {
  ok: boolean;
  message: string;
} | null;

/**
 * Toast success/error whenever a server-action `useActionState` result changes.
 * Skips the initial null state so remounts don't replay stale toasts.
 */
export function useActionToast(state: ActionFeedback) {
  const previous = useRef<ActionFeedback>(null);

  useEffect(() => {
    if (!state || state === previous.current) {
      return;
    }

    previous.current = state;

    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message, { duration: 4000 });
    }
  }, [state]);
}
