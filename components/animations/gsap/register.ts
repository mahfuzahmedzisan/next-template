"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

let registered = false

/**
 * Registers GSAP plugins once on the client.
 * Does not create animations or ScrollTrigger instances.
 */
export function registerGsapPlugins(): void {
  if (registered || typeof window === "undefined") {
    return
  }

  gsap.registerPlugin(useGSAP, ScrollTrigger)
  registered = true
}

export function areGsapPluginsRegistered(): boolean {
  return registered
}
