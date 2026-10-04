import Link from "next/link"

import { site, siteNav } from "@/content/site"
import { ModeToggle } from "@/components/mode-toggle"

import { NavLinks } from "./nav-links"

export function SiteHeader() {
  const items = siteNav()

  return (
    <header
      id="top"
      className="sticky top-0 z-40 border-b border-border bg-background"
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                  className="absolute right-0 z-50 mt-2 min-w-40 rounded-lg border border-border bg-background p-2"
                >
                  <NavLinks listClassName="flex-col" />
                </nav>
              </details>
            </>
          ) : null}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
