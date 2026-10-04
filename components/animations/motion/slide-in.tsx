"use client"

import { slideInVariants } from "@/lib/animations/variants"

import {
  MotionRevealBase,
  type MotionRevealBaseProps,
} from "./motion-reveal-base"

type SlideInProps = Omit<MotionRevealBaseProps, "variants"> & {
  direction?: keyof typeof slideInVariants
}

export function SlideIn({ direction = "left", ...props }: SlideInProps) {
  return <MotionRevealBase variants={slideInVariants[direction]} {...props} />
}
