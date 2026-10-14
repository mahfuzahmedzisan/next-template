"use client"

import { useEffect, useRef, type ElementType, type ReactNode } from "react"
import SplitType from "split-type"

import { usePrefersReducedMotion } from "@/hooks/animations/use-prefers-reduced-motion"
import { cn } from "cn"

export type SplitTextType = "lines" | "words" | "chars"

export type SplitTextResult = {
  words: HTMLElement[] | null
  chars: HTMLElement[] | null
  lines: HTMLElement[] | null
}

type SplitTextProps = {
  children: string
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div"
  className?: string
  types?: SplitTextType[]
  /** When false, never split (plain text). Default true. */
  enabled?: boolean
  onSplit?: (result: SplitTextResult) => void
}

/**
 * Hydration-safe SplitType wrapper.
 * SSR/first paint render plain text; splits only after mount when motion is allowed.
 */
export function SplitText({
  children,
  as = "p",
  className,
  types = ["words", "chars"],
  enabled = true,
  onSplit,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null)
  const instanceRef = useRef<SplitType | null>(null)
  const { ready, prefersReducedMotion } = usePrefersReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const cleanup = () => {
      if (instanceRef.current) {
        instanceRef.current.revert()
        instanceRef.current = null
      }
    }

    cleanup()

    const shouldSplit = enabled && ready && !prefersReducedMotion
    if (!shouldSplit) {
      return cleanup
    }

    const instance = new SplitType(element, {
      types,
      tagName: "span",
      lineClass: "split-line",
      wordClass: "split-word",
      charClass: "split-char",
    })
    instanceRef.current = instance

    // Decorative split nodes — accessible name stays on the root via aria-label
    element
      .querySelectorAll(".split-line, .split-word, .split-char")
      .forEach((node) => {
        node.setAttribute("aria-hidden", "true")
      })

    onSplit?.({
      words: instance.words,
      chars: instance.chars,
      lines: instance.lines,
    })

    return cleanup
  }, [children, types, enabled, ready, prefersReducedMotion, onSplit])

  const isSplitActive = enabled && ready && !prefersReducedMotion
  const Tag = as as ElementType

  return (
    <Tag
      ref={ref}
      className={cn("split-text-target", className)}
      aria-label={isSplitActive ? children : undefined}
    >
      {children as ReactNode}
    </Tag>
  )
}

SplitText.displayName = "SplitText"
