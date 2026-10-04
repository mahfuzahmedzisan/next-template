"use client"

import { slideUpVariants } from "@/lib/animations/variants"

import {
  MotionRevealBase,
  type MotionRevealBaseProps,
} from "./motion-reveal-base"

type SlideUpProps = Omit<MotionRevealBaseProps, "variants">

export function SlideUp(props: SlideUpProps) {
  return <MotionRevealBase variants={slideUpVariants} {...props} />
}
