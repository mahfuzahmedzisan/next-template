"use client"

import { revealVariants } from "@/lib/animations/variants"
import { cn } from "@/lib/utils"

import {
  MotionRevealBase,
  type MotionRevealBaseProps,
} from "./motion-reveal-base"

type RevealProps = Omit<MotionRevealBaseProps, "variants">

export function Reveal({ className, children, ...props }: RevealProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <MotionRevealBase variants={revealVariants} {...props}>
        {children}
      </MotionRevealBase>
    </div>
  )
}
