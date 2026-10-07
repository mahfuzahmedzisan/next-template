"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

import { useTransitionController } from "./transition-provider"

export function TransitionLink({ href, replace, scroll, onNavigate, ...props }: ComponentProps<typeof Link>) {
  const { navigate } = useTransitionController()
  const value = typeof href === "string" ? href : href.pathname ?? ""
  return (
    <Link
      {...props}
      href={href}
      replace={replace}
      scroll={scroll}
      onNavigate={(event) => {
        onNavigate?.(event)
        if (!value || value.startsWith("#") || /^(?:mailto:|tel:)/i.test(value)) return
        const url = new URL(value, window.location.href)
        if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return
        if (url.pathname === window.location.pathname) return
        event.preventDefault()
        navigate(`${url.pathname}${url.search}${url.hash}`, { replace, scroll })
      }}
    />
  )
}
