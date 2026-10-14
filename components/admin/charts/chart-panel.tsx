"use client";

import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "cn";

/** Recharts animates on mount; skip it for people who asked for less motion. */
export function useChartAnimation() {
  return !useReducedMotion();
}

export function ChartPanel({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ChartEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
