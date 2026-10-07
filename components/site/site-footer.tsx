import { TransitionLink as Link } from "@/components/transitions/transition-link"

import { site, siteNav } from "@/content/site"
import { Button } from "@/components/ui/button"

import { ContactLinks } from "./contact-links"
import { NavLinks } from "./nav-links"

export function SiteFooter() {
  const items = siteNav()

  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{site.name}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            A private workspace for your account, session, and security
            settings.
          </p>
          {items.length > 0 ? (
            <nav aria-label="Footer">
              <NavLinks />
            </nav>
          ) : null}
          <ContactLinks />
        </div>
        <Button asChild variant="outline" className="min-h-11 w-fit">
          <Link href="/login">Open workspace</Link>
        </Button>
      </div>
    </footer>
  )
}
