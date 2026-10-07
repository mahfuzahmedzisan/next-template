"use client"

import { useRef } from "react"

import { useGSAP } from "@/components/animations/gsap"
import { robotAsset } from "@/components/svg/generated/robot"
import { SvgAsset } from "@/components/svg/svg-asset"
import { useSvgInstance } from "@/components/svg/use-svg-instance"
import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion"

import { createRobotBlink, createRobotIdle, createRobotWave, resetRobot, setRobotGaze } from "./robot-actions"

export function AnimatedRobot({ className }: { className?: string }) {
  const scope = useRef<HTMLDivElement>(null)
  const robot = useSvgInstance(robotAsset, "robot")
  const { ready, prefersReducedMotion } = usePrefersReducedMotion()

  useGSAP(() => {
    if (!ready || prefersReducedMotion) {
      resetRobot(robot.parts)
      return
    }
    const actions = [createRobotIdle(robot.parts), createRobotBlink(robot.parts), createRobotWave(robot.parts)]
    const finePointer = window.matchMedia("(pointer: fine)")
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || !scope.current) return
      const bounds = scope.current.getBoundingClientRect()
      setRobotGaze(robot.parts, ((event.clientX - bounds.left) / bounds.width - 0.5) * 7, ((event.clientY - bounds.top) / bounds.height - 0.5) * 6)
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      actions.forEach((action) => action.dispose())
      resetRobot(robot.parts)
    }
  }, { scope, dependencies: [ready, prefersReducedMotion], revertOnUpdate: true })

  return (
    <div ref={scope} className={className} aria-hidden="true">
      <SvgAsset
        asset={robotAsset}
        instanceId={robot.instanceId}
        root={{ className: "size-full overflow-visible", "aria-hidden": true, "aria-labelledby": null, role: null, focusable: false }}
        partsRef={robot.partsRef}
      />
    </div>
  )
}
