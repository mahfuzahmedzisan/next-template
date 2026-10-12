"use client"

import { useEffect, useState } from "react"

import { logoutAction } from "@/app/(admin)/actions"
import { SiteHeaderAccount } from "@/components/site/site-header-account"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { Button } from "@/components/ui/button"
import type { UserSummary } from "@/lib/nav"

type SessionState = { status: "loading" } | { status: "guest" } | { status: "user"; user: UserSummary }

/**
 * Reads the session in the browser so public pages stay static: the server
 * render never touches cookies, and every visitor gets the same cached HTML.
 */
export function HeaderSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return setState({ status: "guest" })
        const { user } = (await response.json()) as { user?: UserSummary }
        setState(user ? { status: "user", user } : { status: "guest" })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          if (process.env.NODE_ENV !== "production") console.warn("[header] session check failed", error)
          setState({ status: "guest" })
        }
      })

    return () => controller.abort()
  }, [])

  if (state.status === "loading") {
    return <span className="inline-flex size-11 sm:size-8" aria-hidden />
  }

  if (state.status === "user") {
    return <SiteHeaderAccount user={state.user} onLogout={logoutAction} />
  }

  return (
    <Button asChild size="sm" className="min-h-11 sm:min-h-8">
      <Link href="/login">Sign in</Link>
    </Button>
  )
}
