"use client"

import { useRef } from "react"

import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/animations/motion"
import { gsap, useGSAP } from "@/components/animations/gsap"
import { SplitText } from "@/components/animations/text"

/**
 * Isolated foundation smoke test.
 * Remove by deleting this file and its import from `app/page.tsx`.
 */
export function AnimationSmokeTest() {
  const scope = useRef<HTMLElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!markerRef.current) {
        return
      }

      const mm = gsap.matchMedia()

      // Animate only when the user has not requested reduced motion.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          markerRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: markerRef.current,
              start: "top 80%",
              end: "top 20%",
              scrub: true,
            },
          }
        )
      })

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(markerRef.current, { scaleX: 1 })
      })

      return () => {
        mm.revert()
      }
    },
    { scope, dependencies: [] }
  )

  return (
    <section
      ref={scope}
      aria-label="Animation foundation smoke test"
      className="w-full max-w-3xl space-y-16 overflow-x-hidden border-t border-border px-4 py-16"
    >
      <FadeIn>
        <p className="text-sm text-muted-foreground">Animation smoke · FadeIn</p>
      </FadeIn>

      <SlideUp>
        <p className="text-lg font-medium text-foreground">
          SlideUp viewport entrance
        </p>
      </SlideUp>

      <StaggerContainer className="grid gap-3 sm:grid-cols-3">
        {["One", "Two", "Three"].map((label) => (
          <StaggerItem
            key={label}
            className="rounded-lg border border-border px-4 py-6 text-center text-sm"
          >
            {label}
          </StaggerItem>
        ))}
      </StaggerContainer>

      <SplitText className="text-xl font-semibold tracking-tight text-foreground">
        SplitType word and character foundation
      </SplitText>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scroll to verify Lenis + ScrollTrigger sync
        </p>
        <div
          ref={markerRef}
          className="h-2 origin-left rounded-full bg-primary"
        />
        <div className="h-[50vh] rounded-lg border border-dashed border-border" />
        <div className="h-[50vh] rounded-lg border border-dashed border-border" />
      </div>
    </section>
  )
}
