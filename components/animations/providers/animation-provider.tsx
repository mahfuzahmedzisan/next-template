"use client"

import { usePathname } from "next/navigation"
import { MotionConfig } from "motion/react"
import { ReactLenis, type LenisRef } from "lenis/react"
import {
  useEffect,
  useRef,
  type ReactNode,
} from "react"

import { animationConfig } from "@/lib/animations/config"
import { shouldEnableSmoothScroll } from "@/lib/animations/reduced-motion"
import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion"
import { ScrollLockProvider } from "./scroll-lock-provider"

import { gsap, registerGsapPlugins, ScrollTrigger } from "../gsap"

const GSAP_DEFAULT_LAG_THRESHOLD = 500
const GSAP_DEFAULT_LAG_ADJUSTED = 33

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
  // Stable ticker callback for Strict Mode mount/unmount (same function reference).
  const onTickRef = useRef<(time: number) => void>((time: number) => {
    lenisRef.current?.lenis?.raf(time * 1000)
  })
  const { ready, prefersReducedMotion } = usePrefersReducedMotion()

  const envDisabled = process.env.NEXT_PUBLIC_SMOOTH_SCROLL === "false"
  const isAppShell = pathname.startsWith("/admin")
  const smoothScroll =
    shouldEnableSmoothScroll({
      enabled,
      envDisabled,
      preferenceReady: ready,
      prefersReducedMotion,
    }) && !isAppShell

  // Sync registration (once-guarded) so plugins exist before child useGSAP layout effects.
  registerGsapPlugins()

  // Single RAF loop via GSAP ticker → Lenis.raf (no separate rAF loop)
  useEffect(() => {
    if (!smoothScroll) {
      return
    }

    const onTick = onTickRef.current

    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      gsap.ticker.lagSmoothing(
        GSAP_DEFAULT_LAG_THRESHOLD,
        GSAP_DEFAULT_LAG_ADJUSTED
      )
    }
  }, [smoothScroll])

  // ScrollTrigger ↔ Lenis scroll sync (public lenis.on API returns unsubscribe)
  useEffect(() => {
    if (!smoothScroll) {
      return
    }

    let unsubscribe: (() => void) | undefined
    let rafId = 0
    let cancelled = false

    const attach = () => {
      const lenis = lenisRef.current?.lenis
      if (!lenis || cancelled) {
        return false
      }
      unsubscribe = lenis.on("scroll", ScrollTrigger.update)
      return true
    }

    if (!attach()) {
      rafId = window.requestAnimationFrame(() => {
        attach()
      })
    }

    return () => {
      cancelled = true
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      unsubscribe?.()
    }
  }, [smoothScroll])

  // Refresh ScrollTrigger after App Router navigations
  useEffect(() => {
    if (!smoothScroll) {
      return
    }

    const rafId = window.requestAnimationFrame(() => {
      lenisRef.current?.lenis?.resize()
      ScrollTrigger.refresh()
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [pathname, smoothScroll])

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        duration: animationConfig.duration.normal,
        ease: animationConfig.ease.out,
      }}
    >
      {smoothScroll ? (
        <ReactLenis
          root
          ref={lenisRef}
          options={{
            autoRaf: false,
            anchors: true,
            respectReducedMotion: true,
          }}
        >
          <ScrollLockProvider lenisRef={lenisRef}>{children}</ScrollLockProvider>
        </ReactLenis>
      ) : (
        <ScrollLockProvider lenisRef={lenisRef}>{children}</ScrollLockProvider>
      )}
    </MotionConfig>
  )
}
