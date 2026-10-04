import type { Variants } from "motion/react"

import { animationConfig } from "./config"

const { distance, scale, stagger } = animationConfig

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: distance.md },
  visible: { opacity: 1, y: 0 },
}

export const slideInVariants = {
  left: {
    hidden: { opacity: 0, x: -distance.md },
    visible: { opacity: 1, x: 0 },
  } satisfies Variants,
  right: {
    hidden: { opacity: 0, x: distance.md },
    visible: { opacity: 1, x: 0 },
  } satisfies Variants,
  up: {
    hidden: { opacity: 0, y: distance.md },
    visible: { opacity: 1, y: 0 },
  } satisfies Variants,
  down: {
    hidden: { opacity: 0, y: -distance.md },
    visible: { opacity: 1, y: 0 },
  } satisfies Variants,
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: scale.from },
  visible: { opacity: 1, scale: 1 },
}

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: "0%" },
}

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger.normal,
    },
  },
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: distance.sm },
  visible: { opacity: 1, y: 0 },
}

export const motionVariants = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideIn: slideInVariants,
  scaleIn: scaleInVariants,
  reveal: revealVariants,
  staggerContainer: staggerContainerVariants,
  staggerItem: staggerItemVariants,
} as const
