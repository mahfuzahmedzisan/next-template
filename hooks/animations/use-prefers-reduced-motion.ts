"use client"

import { useEffect, useState } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Hydration-safe reduced-motion preference.
 * - Server + first client render: `{ ready: false, prefersReducedMotion: false }`
 * - After mount: reflects `matchMedia` and updates on change
 */
export function usePrefersReducedMotion(): {
  ready: boolean
  prefersReducedMotion: boolean
} {
  const [state, setState] = useState({
    ready: false,
    prefersReducedMotion: false,
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY)

    const update = () => {
      setState({
        ready: true,
        prefersReducedMotion: mediaQuery.matches,
      })
    }

    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  return state
}
