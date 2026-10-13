"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"

/** The native disclosure stays open across client navigations unless closed here. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.open = false
  }, [pathname])

  return (
    <details ref={ref} className="relative sm:hidden">
      <summary className="site-nav site-menu">Menu</summary>
      {children}
    </details>
  )
}
