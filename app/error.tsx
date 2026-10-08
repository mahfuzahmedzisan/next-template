"use client";

import { useEffect } from "react";

import { StatusStage } from "@/components/status/status-stage";
import { RouteReady } from "@/components/transitions/route-ready";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
      return;
    }

    reportError(error);
  }, [error]);

  return (
    <StatusStage
      code="500"
      tone="error"
      title="Something went wrong"
      description="This page could not be shown. You can try again, or go back home."
    >
      <RouteReady outcome="error" />
      <Button type="button" onClick={() => retry()}>
        Try again
      </Button>
      <Button variant="outline" asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </StatusStage>
  );
}
