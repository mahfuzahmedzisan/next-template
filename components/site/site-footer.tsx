import { site, siteNav } from "@/content/site"

import { ContactLinks } from "./contact-links"
import { NavLinks } from "./nav-links"

export function SiteFooter() {
  const items = siteNav()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8">
        <p className="text-sm text-muted-foreground">{site.name}</p>
        {items.length > 0 ? (
          <nav aria-label="Footer">
            <NavLinks />
          </nav>
        ) : null}
        <ContactLinks />
      </div>
    </footer>
  )
}
