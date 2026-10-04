import type { Transition } from "motion/react"

import { animationConfig } from "./config"

/** Pure helper — no browser APIs. */
export function getTransition(reduceMotion: boolean, delay = 0): Transition {
  if (reduceMotion) {
    return {
      duration: animationConfig.duration.instant,
      delay: 0,
    }
  }

  return {
    duration: animationConfig.duration.normal,
    ease: animationConfig.ease.out,
    delay,
  }
}

/** Pure helper — no browser APIs. */
export function shouldEnableSmoothScroll({
  enabled,
  envDisabled,
  preferenceReady,
  prefersReducedMotion,
}: {
  enabled: boolean
  envDisabled: boolean
  preferenceReady: boolean
  prefersReducedMotion: boolean
}): boolean {
  return enabled && !envDisabled && preferenceReady && !prefersReducedMotion
}
