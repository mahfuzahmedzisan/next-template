"use client";

import { useEffect } from "react";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { RouteReady } from "@/components/transitions/route-ready";

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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
      <RouteReady outcome="error" />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="text-base leading-7 text-muted-foreground">
        This page could not be shown. You can try again.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" className="min-h-11" onClick={() => retry()}>
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
