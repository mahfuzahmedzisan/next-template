"use client";

import { useEffect } from "react";

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
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            This page could not be shown. You can try again.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" className="min-h-11" onClick={() => retry()}>
              Try again
            </Button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- replaces the root layout */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-md text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
