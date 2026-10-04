"use client"

import type Lenis from "lenis"

type ScrollToTarget = number | string | HTMLElement

type ScrollToOptions = Parameters<Lenis["scrollTo"]>[1]

/**
 * Programmatic scroll helper.
 * Uses Lenis when available; falls back to native scroll behavior.
 */
export function scrollToTarget(
  target: ScrollToTarget,
  options?: ScrollToOptions & { lenis?: Lenis | null }
): void {
  const { lenis, ...scrollOptions } = options ?? {}

  if (lenis) {
    lenis.scrollTo(target, scrollOptions)
    return
  }

  if (typeof window === "undefined") {
    return
  }

  if (typeof target === "number") {
    window.scrollTo({
      top: target,
      behavior: scrollOptions?.immediate === false ? "smooth" : "auto",
    })
    return
  }

  const element =
    typeof target === "string" ? document.querySelector(target) : target

  if (element instanceof HTMLElement) {
    element.scrollIntoView({
      behavior: scrollOptions?.immediate === false ? "smooth" : "auto",
      block: "start",
    })
  }
}
