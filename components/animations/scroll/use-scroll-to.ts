"use client"

import { useLenis } from "lenis/react"
import { useCallback } from "react"

import { scrollToTarget } from "./scroll-to"

/**
 * Lenis-aware scroll helper for client components under AnimationProvider.
 * Falls back to native scrolling when Lenis is not mounted.
 */
export function useScrollTo() {
  const lenis = useLenis()

  return useCallback(
    (
      target: Parameters<typeof scrollToTarget>[0],
      options?: Omit<NonNullable<Parameters<typeof scrollToTarget>[1]>, "lenis">
    ) => {
      scrollToTarget(target, { ...options, lenis })
    },
    [lenis]
  )
}
