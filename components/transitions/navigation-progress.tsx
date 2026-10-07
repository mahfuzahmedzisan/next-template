"use client";

import { useEffect, useRef, useState } from "react";

import { gsap, useGSAP } from "@/components/animations/gsap";
import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion";
import type { TransitionPhase } from "@/lib/transitions/types";

const INDICATOR_DELAY_MS = 150;
const STATUS_DELAY_MS = 600;

export function NavigationProgress({
  phase,
  onFinished,
}: {
  phase: TransitionPhase;
  onFinished(): void;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const waitingTimeline = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const waiting = phase === "navigationDispatched" || phase === "routeWaiting";
  const active = phase !== "idle";

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setShowStatus(true), STATUS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [waiting]);

  useGSAP(
    () => {
      if (!layer.current || !progress.current) return;

      if (waiting && !waitingTimeline.current) {
        gsap.set(layer.current, { autoAlpha: 0 });
        gsap.set(progress.current, { scaleX: 0.08 });
        waitingTimeline.current = gsap
          .timeline()
          .to(layer.current, {
            autoAlpha: 1,
            duration: prefersReducedMotion ? 0 : 0.08,
            delay: INDICATOR_DELAY_MS / 1000,
            ease: "none",
          })
          .to(
            progress.current,
            {
              scaleX: 0.85,
              duration: prefersReducedMotion ? 0 : 1.35,
              ease: "power1.out",
            },
            "<",
          );
        return;
      }

      if (phase === "routeRevealing") {
        waitingTimeline.current?.kill();
        waitingTimeline.current = null;

        if (Number.parseFloat(getComputedStyle(layer.current).opacity) < 0.01) {
          onFinished();
          return;
        }

        gsap
          .timeline({ onComplete: onFinished })
          .to(progress.current, {
            scaleX: 1,
            duration: prefersReducedMotion ? 0 : 0.07,
            ease: "power1.out",
          })
          .to(layer.current, {
            autoAlpha: 0,
            duration: prefersReducedMotion ? 0.04 : 0.08,
            ease: "none",
          });
        return;
      }

      if (phase === "recovering") {
        waitingTimeline.current?.kill();
        waitingTimeline.current = null;
        gsap.set(layer.current, { autoAlpha: 0 });
        onFinished();
      }
    },
    { scope: layer, dependencies: [phase, prefersReducedMotion, waiting] },
  );

  return (
    <div
      ref={layer}
      className="navigation-progress"
      data-navigation-progress
      data-active={active}
      aria-hidden={!showStatus}
    >
      <span className="navigation-progress__track" aria-hidden="true">
        <span ref={progress} className="navigation-progress__bar" />
      </span>
      {showStatus ? (
        <span
          className="navigation-progress__status"
          role="status"
          aria-live="polite"
        >
          <span className="navigation-progress__dot" aria-hidden="true" />
          Navigating
        </span>
      ) : null}
    </div>
  );
}
