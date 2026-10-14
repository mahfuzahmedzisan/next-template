"use client"

import { usePathname } from "next/navigation"
import { LazyMotion, MotionConfig } from "motion/react"
import { ReactLenis, type LenisRef } from "lenis/react"
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { animationConfig } from "@/lib/animations/config"
import { shouldEnableSmoothScroll } from "@/lib/animations/reduced-motion"
import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion"
import { ScrollLockProvider } from "./scroll-lock-provider"

// ReactLenis rebuilds the instance whenever its options change, so they stay
// constant; smooth wheel is switched at runtime instead.
const LENIS_OPTIONS = {
  autoRaf: true,
  anchors: true,
  respectReducedMotion: true,
  smoothWheel: false,
} as const

const OVERLAY_ROLES = new Set(["dialog", "alertdialog", "menu", "listbox"])

function isOverlayNode(node: HTMLElement) {
  return (
    OVERLAY_ROLES.has(node.getAttribute("role") ?? "") ||
    node.hasAttribute("data-radix-popper-content-wrapper")
  )
}

// Public components use `m.*`, so the animation features load in their own chunk.
const loadMotionFeatures = () =>
  import("@/lib/animations/motion-features").then((module) => module.default)

type AnimationProviderProps = {
  children: ReactNode
  /** When false, Lenis is never mounted. Default true. */
  enabled?: boolean
}

export function AnimationProvider({
  children,
  enabled = true,
}: AnimationProviderProps) {
  const pathname = usePathname()
  const lenisRef = useRef<LenisRef>(null)
  const smoothRef = useRef(false)
  // A stopped Lenis cancels every wheel event, including ones inside an open
  // modal or popup list, so Lenis ignores overlays and, with smooth scroll
  // off, everything.
  const [lenisOptions] = useState(() => ({
    ...LENIS_OPTIONS,
    prevent: (node: HTMLElement) => !smoothRef.current || isOverlayNode(node),
  }))
  const { ready, prefersReducedMotion } = usePrefersReducedMotion()

  const envDisabled = process.env.NEXT_PUBLIC_SMOOTH_SCROLL === "false"
  const mounted = enabled && !envDisabled
  const isAppShell = pathname.startsWith("/admin")
  const smoothScroll =
    shouldEnableSmoothScroll({
      enabled,
      envDisabled,
      preferenceReady: ready,
      prefersReducedMotion,
    }) && !isAppShell

  // Lenis reads smoothWheel on every wheel event. lenis.stop() is not used
  // here because it clips <html> overflow and would block native scrolling.
  useEffect(() => {
    if (!mounted) return

    let rafId = 0
    const apply = () => {
      const lenis = lenisRef.current?.lenis
      if (!lenis) {
        rafId = window.requestAnimationFrame(apply)
        return
      }
      smoothRef.current = smoothScroll
      lenis.options.smoothWheel = smoothScroll
      lenis.resize()
    }
    apply()

    return () => window.cancelAnimationFrame(rafId)
  }, [mounted, pathname, smoothScroll])

  return (
    <LazyMotion features={loadMotionFeatures}>
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: animationConfig.duration.normal,
          ease: animationConfig.ease.out,
        }}
      >
        {mounted ? (
          <ReactLenis root ref={lenisRef} options={lenisOptions}>
            <ScrollLockProvider lenisRef={lenisRef}>{children}</ScrollLockProvider>
          </ReactLenis>
        ) : (
          <ScrollLockProvider lenisRef={lenisRef}>{children}</ScrollLockProvider>
        )}
      </MotionConfig>
    </LazyMotion>
  )
}
