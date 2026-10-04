"use client"

import { scaleInVariants } from "@/lib/animations/variants"

import {
  MotionRevealBase,
  type MotionRevealBaseProps,
} from "./motion-reveal-base"

type ScaleInProps = Omit<MotionRevealBaseProps, "variants">

export function ScaleIn(props: ScaleInProps) {
  return <MotionRevealBase variants={scaleInVariants} {...props} />
}
