"use client";

import { useEffect } from "react";

import { StatusStage } from "@/components/status/status-stage";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <StatusStage
          code="500"
          tone="error"
          title="Something went wrong"
          description="This page could not be shown. You can try again, or go back home."
        >
          <Button type="button" onClick={() => retry()}>
            Try again
          </Button>
          <Button variant="outline" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this boundary replaces the root layout */}
            <a href="/">Back to home</a>
          </Button>
        </StatusStage>
      </body>
    </html>
  );
}
