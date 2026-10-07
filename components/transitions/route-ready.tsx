"use client"

import { usePathname } from "next/navigation"
import { useEffect, useId } from "react"

import { useTransitionController } from "./transition-provider"

export function RouteReady({ outcome = "ready" }: { outcome?: "ready" | "error" | "not-found" }) {
  const pathname = usePathname()
  const id = useId()
  const { markReady } = useTransitionController()
  useEffect(() => markReady(pathname, id, outcome), [id, markReady, outcome, pathname])
  return null
}
