"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion";
import type { TransitionPhase } from "@/lib/transitions/types";

const INDICATOR_DELAY_MS = 150;
const STATUS_DELAY_MS = 600;
/** Quadratic ease-out, the curve the bar used under GSAP's power1.out. */
const EASE_OUT = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

export function NavigationProgress({
  phase,
  onFinished,
}: {
  phase: TransitionPhase;
  onFinished(): void;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const waitingAnimations = useRef<Animation[] | null>(null);
  const finishingAnimations = useRef<Animation[]>([]);
  const settled = useRef(false);
  const [showStatus, setShowStatus] = useState(false);
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const waiting = phase === "navigationDispatched" || phase === "routeWaiting";
  const active = phase !== "idle";

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setShowStatus(true), STATUS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [waiting]);

  useEffect(
    () => () => {
      waitingAnimations.current?.forEach((animation) => animation.cancel());
      finishingAnimations.current.forEach((animation) => animation.cancel());
    },
    [],
  );

  useLayoutEffect(() => {
    const layerNode = layer.current;
    const bar = progress.current;
    if (!layerNode || !bar || settled.current) return;
    const ms = (seconds: number) => (prefersReducedMotion ? 0 : seconds * 1000);

    if (waiting && !waitingAnimations.current) {
      waitingAnimations.current = [
        layerNode.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: ms(0.08),
          delay: INDICATOR_DELAY_MS,
          easing: "linear",
          fill: "both",
        }),
        bar.animate(
          [{ transform: "scaleX(0.08)" }, { transform: "scaleX(0.85)" }],
          {
            duration: ms(1.35),
            delay: INDICATOR_DELAY_MS,
            easing: EASE_OUT,
            fill: "both",
          },
        ),
      ];
      return;
    }

    if (phase !== "routeRevealing" && phase !== "recovering") return;

    const opacity = Number.parseFloat(getComputedStyle(layerNode).opacity);
    const transform = getComputedStyle(bar).transform;
    waitingAnimations.current?.forEach((animation) => animation.cancel());
    waitingAnimations.current = null;
    settled.current = true;

    if (phase === "recovering" || opacity < 0.01) {
      onFinished();
      return;
    }

    const grow = bar.animate(
      [{ transform: transform === "none" ? "scaleX(0.08)" : transform }, { transform: "scaleX(1)" }],
      { duration: ms(0.07), easing: EASE_OUT, fill: "forwards" },
    );
    const fade = layerNode.animate([{ opacity }, { opacity: 0 }], {
      duration: prefersReducedMotion ? 40 : 80,
      delay: ms(0.07),
      easing: "linear",
      fill: "forwards",
    });
    finishingAnimations.current = [grow, fade];
    fade.finished.then(onFinished, () => {});
  }, [onFinished, phase, prefersReducedMotion, waiting]);

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
