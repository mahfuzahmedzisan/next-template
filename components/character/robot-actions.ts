"use client"

import { gsap } from "@/components/animations/gsap"
import type { SvgPartRegistry } from "@/lib/svg/types"

export interface RobotActionHandle {
  play(): void
  stop(): void
  dispose(): void
}

function handle(timeline: ReturnType<typeof gsap.timeline>, neutral: () => void): RobotActionHandle {
  return {
    play: () => timeline.play(),
    stop: () => { timeline.pause(0); neutral() },
    dispose: () => { timeline.kill(); neutral() },
  }
}

const element = (parts: SvgPartRegistry, name: string) => parts.get(name)

export function createRobotIdle(parts: SvgPartRegistry): RobotActionHandle {
  const root = element(parts, "character-root")
  const head = element(parts, "head")
  const timeline = gsap.timeline({ repeat: -1, yoyo: true })
    .to(root, { y: -2, duration: 1.8, ease: "sine.inOut" }, 0)
    .to(head, { rotation: 1, svgOrigin: "155 155", duration: 1.8, ease: "sine.inOut" }, 0)
  return handle(timeline, () => gsap.set([root, head], { clearProps: "transform" }))
}

export function createRobotWave(parts: SvgPartRegistry): RobotActionHandle {
  const arm = element(parts, "right-arm")
  const forearm = element(parts, "right-lower-arm")
  const hand = element(parts, "right-hand-group")
  const targets = [arm, forearm, hand].filter(Boolean)
  const timeline = gsap.timeline({ repeat: -1, repeatDelay: 2.2 })
    .to(arm, { rotation: -22, svgOrigin: "206 176", duration: 0.3, ease: "power2.out" })
    .to(forearm, { rotation: -18, svgOrigin: "223 213", duration: 0.25, ease: "power2.out" }, "<")
    .to(hand, { rotation: 13, svgOrigin: "230 244", duration: 0.16, repeat: 3, yoyo: true, ease: "sine.inOut" })
    .to(targets, { rotation: 0, duration: 0.35, ease: "power2.inOut" })
  return handle(timeline, () => gsap.set(targets, { clearProps: "transform" }))
}

export function createRobotBlink(parts: SvgPartRegistry): RobotActionHandle {
  const eyes = parts.getMany(["left-eye-content", "right-eye-content"])
  const lids = parts.getMany(["left-eyelid", "right-eyelid"])
  const timeline = gsap.timeline({ repeat: -1, repeatDelay: 3.4 })
    .to(eyes, { scaleY: 0.08, transformOrigin: "center center", duration: 0.08, ease: "power2.in" })
    .to(lids, { opacity: 1, duration: 0.04 }, "<")
    .to(eyes, { scaleY: 1, duration: 0.1, ease: "power2.out" })
    .to(lids, { opacity: 0, duration: 0.06 }, "<")
  return handle(timeline, () => {
    gsap.set(eyes, { clearProps: "transform" })
    gsap.set(lids, { opacity: 0 })
  })
}

export function createRobotHead(parts: SvgPartRegistry): RobotActionHandle {
  const head = element(parts, "head")
  const timeline = gsap.timeline({ repeat: -1, yoyo: true })
    .fromTo(head, { rotation: -2, svgOrigin: "155 155" }, { rotation: 2, svgOrigin: "155 155", duration: 2.4, ease: "sine.inOut" })
  return handle(timeline, () => gsap.set(head, { clearProps: "transform" }))
}

export function createRobotStep(parts: SvgPartRegistry): RobotActionHandle {
  const root = element(parts, "character-root")
  const leftLeg = element(parts, "left-leg")
  const rightLeg = element(parts, "right-leg")
  const leftLower = element(parts, "left-lower-leg")
  const rightLower = element(parts, "right-lower-leg")
  const targets = [root, leftLeg, rightLeg, leftLower, rightLower].filter(Boolean)
  const timeline = gsap.timeline({ repeat: -1, yoyo: true })
    .to(root, { y: -1.5, duration: 0.34, ease: "sine.inOut" }, 0)
    .to(leftLeg, { rotation: 3, svgOrigin: "122 238", duration: 0.34 }, 0)
    .to(rightLeg, { rotation: -3, svgOrigin: "188 238", duration: 0.34 }, 0)
    .to(leftLower, { rotation: -2, svgOrigin: "122 283", duration: 0.34 }, 0)
    .to(rightLower, { rotation: 2, svgOrigin: "188 283", duration: 0.34 }, 0)
  return handle(timeline, () => gsap.set(targets, { clearProps: "transform" }))
}

export function createRobotExpression(parts: SvgPartRegistry): RobotActionHandle {
  const brows = parts.getMany(["left-eyebrow", "right-eyebrow"])
  const mouth = element(parts, "mouth")
  const targets = [...brows, mouth].filter(Boolean)
  const timeline = gsap.timeline({ paused: true })
    .to(brows, { y: -1.5, duration: 0.18, ease: "power2.out" }, 0)
    .to(mouth, { scaleX: 1.08, svgOrigin: "155 132", duration: 0.18, ease: "power2.out" }, 0)
  return handle(timeline, () => gsap.set(targets, { clearProps: "transform" }))
}

export function setRobotGaze(parts: SvgPartRegistry, x: number, y: number) {
  const pupils = parts.getMany(["left-pupil", "right-pupil"])
  gsap.to(pupils, {
    x: gsap.utils.clamp(-3.5, 3.5, x),
    y: gsap.utils.clamp(-3, 3, y),
    duration: 0.22,
    overwrite: "auto",
    ease: "power2.out",
  })
}

export function resetRobot(parts: SvgPartRegistry) {
  const names = ["character-root", "head", "right-arm", "right-lower-arm", "right-hand-group", "left-pupil", "right-pupil", "left-eye-content", "right-eye-content"]
  gsap.killTweensOf(parts.getMany(names))
  gsap.set(parts.getMany(names), { clearProps: "transform" })
  gsap.set(parts.getMany(["left-eyelid", "right-eyelid"]), { opacity: 0 })
}
