import { TransitionLink as Link } from "@/components/transitions/transition-link"

import { ModeToggle } from "@/components/mode-toggle"
import { HeaderSession } from "@/components/site/header-session"
import { primaryNav } from "@/content/site"
import { fetchSiteIdentity } from "@/lib/seo/public"

import { NavLinks } from "./nav-links"

export async function SiteHeader() {
  const items = primaryNav
  const identity = await fetchSiteIdentity()

  return (
    <header
      id="top"
      className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-md"
    >
      <a href="#content" className="site-skip">
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="site-nav px-0 font-semibold tracking-tight hover:text-foreground">
          {identity.name}
        </Link>
        <div className="flex items-center gap-2">
          {items.length > 0 ? (
            <>
              <nav aria-label="Primary" className="hidden sm:block">
                <NavLinks />
              </nav>
              <details className="relative sm:hidden">
                <summary className="site-nav cursor-pointer list-none px-3 [&::-webkit-details-marker]:hidden">Menu</summary>
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
          <HeaderSession />
        </div>
      </div>
    </header>
  )
}
