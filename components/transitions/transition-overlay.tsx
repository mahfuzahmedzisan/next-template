"use client"

import { useRef } from "react"

import { gsap, useGSAP } from "@/components/animations/gsap"
import { AnimatedRobot } from "@/components/character/animated-robot"
import { logoMarkAsset } from "@/components/svg/generated/01-logo-mark"
import { ringAsset } from "@/components/svg/generated/08-ring"
import { sparkAsset } from "@/components/svg/generated/09-spark"
import { transitionPanelAsset } from "@/components/svg/generated/20-transition-panel"
import { SvgAsset } from "@/components/svg/svg-asset"
import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion"
import type { TransitionPhase } from "@/lib/transitions/types"

export function TransitionOverlay({ phase, initial, onCovered, onRevealed }: { phase: TransitionPhase; initial: boolean; onCovered(): void; onRevealed(): void }) {
  const layer = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const { prefersReducedMotion } = usePrefersReducedMotion()
  const visible = phase !== "idle" && phase !== "booting"

  useGSAP(() => {
    if (!panel.current) return
    if (phase === "splashWaiting") gsap.set(panel.current, { yPercent: 0, opacity: 1 })
    if (phase === "routeCovering") {
      gsap.fromTo(panel.current, { yPercent: 100, opacity: 1 }, { yPercent: 0, duration: prefersReducedMotion ? 0.06 : 0.26, ease: "power3.inOut", onComplete: onCovered })
    }
    if (phase === "splashRevealing" || phase === "routeRevealing") {
      gsap.to(panel.current, { yPercent: prefersReducedMotion ? 0 : -100, opacity: 0, duration: prefersReducedMotion ? 0.08 : 0.32, ease: "power3.inOut", onComplete: onRevealed })
    }
    if (phase === "recovering") {
      gsap.set(panel.current, { yPercent: -100, opacity: 0 })
      onRevealed()
    }
  }, { scope: layer, dependencies: [phase, prefersReducedMotion], revertOnUpdate: true })

  return (
    <div ref={layer} data-transition-layer data-visible={visible && !initial} className="transition-overlay" aria-hidden={!visible}>
      <div ref={panel} className="transition-panel">
        <SvgAsset asset={transitionPanelAsset} instanceId="transition-panel-art" root={{ className: "transition-panel-art", preserveAspectRatio: "none", "aria-hidden": true }} />
        <SvgAsset asset={ringAsset} instanceId="transition-ring" root={{ className: "transition-geometry transition-ring", "aria-hidden": true }} />
        <SvgAsset asset={sparkAsset} instanceId="transition-spark" root={{ className: "transition-geometry transition-spark", "aria-hidden": true }} />
        <div className="transition-brand">
          <SvgAsset asset={logoMarkAsset} instanceId="transition-logo" root={{ className: "transition-logo", "aria-hidden": true }} />
          <AnimatedRobot className="transition-robot" />
        </div>
        <div className="transition-status" role="status" aria-live="polite" tabIndex={-1}>Loading page</div>
      </div>
    </div>
  )
}
