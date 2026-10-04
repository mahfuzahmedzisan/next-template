"use client"

export { useGSAP } from "@gsap/react"
export { default as gsap } from "gsap"
export { ScrollTrigger } from "gsap/ScrollTrigger"

export { areGsapPluginsRegistered, registerGsapPlugins } from "./register"

import { registerGsapPlugins } from "./register"

// Ensure plugins are registered before any useGSAP layout effects run.
registerGsapPlugins()

