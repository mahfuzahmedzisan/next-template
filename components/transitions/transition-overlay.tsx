"use client"

import { useRef } from "react"

import { gsap, useGSAP } from "@/components/animations/gsap"
import { logoMarkAsset } from "@/components/svg/generated/01-logo-mark"
import { SvgAsset } from "@/components/svg/svg-asset"
import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion"
import type { TransitionPhase } from "@/lib/transitions/types"

export function TransitionOverlay({ phase, initial, onRevealed }: { phase: TransitionPhase; initial: boolean; onRevealed(): void }) {
  const layer = useRef<HTMLDivElement>(null)
  const splash = useRef<HTMLDivElement>(null)
  const splashMark = useRef<HTMLDivElement>(null)
  const splashRule = useRef<HTMLSpanElement>(null)
  const navigation = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLSpanElement>(null)
  const { prefersReducedMotion } = usePrefersReducedMotion()
  const visible = phase !== "idle" && phase !== "booting"

  useGSAP(() => {
    if (!splash.current || !navigation.current || !progress.current) return

    if (phase === "splashWaiting") {
      gsap.set(splash.current, { opacity: 1 })
      if (prefersReducedMotion) {
        gsap.set([splashMark.current, splashRule.current], { opacity: 1, clearProps: "transform" })
      } else {
        gsap.fromTo(splashMark.current, { opacity: 0, y: 8, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power2.out" })
        gsap.fromTo(splashRule.current, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out", delay: 0.08 })
      }
    }

    if (phase === "splashRevealing") {
      gsap.to(splash.current, { opacity: 0, duration: prefersReducedMotion ? 0.06 : 0.2, ease: "power1.out", onComplete: onRevealed })
    }

    if (phase === "routeCovering" || phase === "navigationDispatched" || phase === "routeWaiting") {
      gsap.set(progress.current, { scaleX: 0.06 })
      gsap.to(navigation.current, { opacity: 1, duration: 0.12, delay: 0.12, ease: "linear" })
      gsap.to(progress.current, { scaleX: 0.82, duration: 1.1, delay: 0.12, ease: "power1.out" })
    }

    if (phase === "routeRevealing") {
      if (Number.parseFloat(getComputedStyle(navigation.current).opacity) < 0.01) {
        onRevealed()
        return
      }
      gsap.timeline({ onComplete: onRevealed })
        .to(progress.current, { scaleX: 1, duration: prefersReducedMotion ? 0.03 : 0.1, ease: "power1.out" })
        .to(navigation.current, { opacity: 0, duration: prefersReducedMotion ? 0.03 : 0.12, ease: "linear" })
    }

    if (phase === "recovering") {
      gsap.set([splash.current, navigation.current], { opacity: 0 })
      onRevealed()
    }
  }, { scope: layer, dependencies: [phase, prefersReducedMotion], revertOnUpdate: true })

  return (
    <div
      ref={layer}
      data-transition-layer
      data-kind={initial ? "splash" : "navigation"}
      data-visible={visible && !initial}
      className="transition-layer"
      aria-hidden={!visible}
    >
      <div ref={splash} className="initial-splash">
        <div ref={splashMark} className="initial-splash__brand">
          <SvgAsset
            asset={logoMarkAsset}
            instanceId="initial-splash-logo"
            root={{ className: "initial-splash__logo", "aria-hidden": true }}
          />
          <div className="initial-splash__copy">
            <strong>Mahfuz Ahmed</strong>
            <span>Portfolio &amp; workspace</span>
          </div>
        </div>
        <span ref={splashRule} className="initial-splash__rule" />
        <span className="sr-only" role="status" aria-live="polite">Preparing site</span>
      </div>

      <div ref={navigation} className="navigation-loader" role="status" aria-live="polite">
        <span className="navigation-loader__track">
          <span ref={progress} className="navigation-loader__progress" />
        </span>
        <span className="navigation-loader__label">
          <span className="navigation-loader__dot" />
          Loading
        </span>
      </div>
    </div>
  )
}
