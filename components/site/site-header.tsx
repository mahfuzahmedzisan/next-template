import { TransitionLink as Link } from "@/components/transitions/transition-link"

import { ModeToggle } from "@/components/mode-toggle"
import { HeaderSession } from "@/components/site/header-session"
import { primaryNav } from "@/content/site"
import { fetchSiteIdentity } from "@/lib/seo/public"

import { MobileMenu } from "./mobile-menu"
import { NavLinks } from "./nav-links"

export async function SiteHeader() {
  const items = primaryNav
  const identity = await fetchSiteIdentity()

  return (
    <header id="top" className="site-header">
      <a href="#content" className="site-skip">
        Skip to content
      </a>
      <div className="site-bar">
        <Link href="/" className="site-nav site-brand">
          {identity.name}
        </Link>
        <div className="flex items-center gap-2">
          {items.length > 0 ? (
            <>
              <nav aria-label="Primary" className="hidden sm:block">
                <NavLinks />
              </nav>
              <MobileMenu>
                <nav aria-label="Primary" className="site-menu-panel">
                  <NavLinks listClassName="flex-col" />
                </nav>
              </MobileMenu>
            </>
          ) : null}
          <ModeToggle />
          <HeaderSession />
        </div>
      </div>
    </header>
  )
}
