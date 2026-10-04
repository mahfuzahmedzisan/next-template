"use client"

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react"

import { animationConfig } from "@/lib/animations/config"
import { getTransition } from "@/lib/animations/reduced-motion"
import { cn } from "@/lib/utils"

export type MotionRevealBaseProps = {
  children: React.ReactNode
  className?: string
  variants: Variants
  delay?: number
  once?: boolean
  amount?: number
  margin?: string
} & Omit<
  HTMLMotionProps<"div">,
  "children" | "variants" | "initial" | "animate" | "whileInView"
>

export function MotionRevealBase({
  children,
  className,
  variants,
  delay = 0,
  once = animationConfig.viewport.once,
  amount = animationConfig.viewport.amount,
  margin = animationConfig.viewport.margin,
  ...props
}: MotionRevealBaseProps) {
  // Motions docs: useReducedMotion updates at runtime; MotionConfig
  // reducedMotion="user" already disables transforms site-wide.
  // Render the final visible state so content is never gated on animation.
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className={className} {...(props as React.ComponentProps<"div">)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin }}
      transition={getTransition(false, delay)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
