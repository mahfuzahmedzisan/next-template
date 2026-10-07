import { TransitionLink as Link } from "@/components/transitions/transition-link"

import { logoutAction } from "@/app/(admin)/actions"
import { ModeToggle } from "@/components/mode-toggle"
import { SiteHeaderAccount } from "@/components/site/site-header-account"
import { Button } from "@/components/ui/button"
import { site, siteNav } from "@/content/site"
import { getSession } from "@/lib/auth/auth-cookies"

import { NavLinks } from "./nav-links"

export async function SiteHeader() {
  const items = siteNav()
  const session = await getSession()

  return (
    <header
      id="top"
      className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-md"
    >
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-background focus:px-3 focus:text-sm focus:font-medium focus:text-foreground focus:ring-3 focus:ring-ring/50 focus:outline-none"
      >
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold tracking-tight text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {site.name}
        </Link>
        <div className="flex items-center gap-2">
          {items.length > 0 ? (
            <>
              <nav aria-label="Primary" className="hidden sm:block">
                <NavLinks />
              </nav>
              <details className="relative sm:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  Menu
                </summary>
                <nav
                  aria-label="Primary"
                  className="absolute right-0 z-50 mt-2 min-w-40 rounded-xl border border-border/70 bg-background/95 p-2 shadow-sm backdrop-blur-md"
                >
                  <NavLinks listClassName="flex-col" />
                </nav>
              </details>
            </>
          ) : null}
          <ModeToggle />
          {session ? (
            <SiteHeaderAccount user={session.user} onLogout={logoutAction} />
          ) : (
            <Button asChild size="sm" className="min-h-11 sm:min-h-8">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
