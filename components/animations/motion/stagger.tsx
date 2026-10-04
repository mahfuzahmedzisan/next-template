"use client"

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react"

import { animationConfig } from "@/lib/animations/config"
import { getTransition } from "@/lib/animations/reduced-motion"
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/animations/variants"
import { cn } from "@/lib/utils"

type StaggerContainerProps = {
  children: React.ReactNode
  className?: string
  once?: boolean
  amount?: number
  stagger?: number
} & Omit<
  HTMLMotionProps<"div">,
  "children" | "variants" | "initial" | "animate" | "whileInView"
>

export function StaggerContainer({
  children,
  className,
  once = animationConfig.viewport.once,
  amount = animationConfig.viewport.amount,
  stagger = animationConfig.stagger.normal,
  ...props
}: StaggerContainerProps) {
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
      variants={{
        ...staggerContainerVariants,
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once,
        amount,
        margin: animationConfig.viewport.margin,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

type StaggerItemProps = {
  children: React.ReactNode
  className?: string
  delay?: number
} & Omit<
  HTMLMotionProps<"div">,
  "children" | "variants" | "initial" | "animate"
>

export function StaggerItem({
  children,
  className,
  delay = 0,
  ...props
}: StaggerItemProps) {
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
      variants={staggerItemVariants}
      transition={getTransition(false, delay)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
