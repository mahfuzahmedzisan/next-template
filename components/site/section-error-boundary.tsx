"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { TransitionLink as Link } from "@/components/transitions/transition-link";

import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

type SectionErrorBoundaryProps = {
  children: ReactNode;
};

type SectionErrorBoundaryState = {
  hasError: boolean;
};

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error(error, info);
      return;
    }

    reportError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main id="content" tabIndex={-1} className="mx-auto outline-none flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            This page could not be shown. You can try again.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              className="min-h-11"
              onClick={() => this.setState({ hasError: false })}
            >
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

    return (
      <div className="flex min-h-0 flex-1 flex-col">{this.props.children}</div>
    );
  }
}
