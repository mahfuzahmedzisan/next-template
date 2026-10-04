"use client"

import { fadeVariants } from "@/lib/animations/variants"

import {
  MotionRevealBase,
  type MotionRevealBaseProps,
} from "./motion-reveal-base"

type FadeInProps = Omit<MotionRevealBaseProps, "variants">

export function FadeIn(props: FadeInProps) {
  return <MotionRevealBase variants={fadeVariants} {...props} />
}
