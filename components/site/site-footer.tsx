import type { Route } from "next"

import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { legalNav, primaryNav, site } from "@/content/site"
import { fetchSiteIdentity } from "@/lib/seo/public"

export async function SiteFooter() {
  const identity = await fetchSiteIdentity()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/70">
      <div className="site-footer-grid">
        <div>
          <p className="text-sm font-semibold">{identity.name}</p>
          <p className="site-small mt-3 max-w-sm">
            {site.summary} {site.location ? `${site.location}. ` : null}
            {site.availability}
          </p>
        </div>
        <nav aria-label="Site">
          <p className="text-sm font-medium">Pages</p>
          <ul className="mt-2">
            <li>
              <Link href="/" className="site-foot">
                Home
              </Link>
            </li>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href as Route} className="site-foot">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-sm font-medium">Legal</p>
          <ul className="mt-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href as Route} className="site-foot">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-medium">Elsewhere</p>
          <ul className="mt-2">
            {site.email ? (
              <li>
                <a href={`mailto:${site.email}`} className="site-foot">
                  Email
                </a>
              </li>
            ) : null}
            {site.profiles.map((profile) => (
              <li key={profile.href}>
                <a href={profile.href} className="site-foot" rel="me noopener" target="_blank">
                  {profile.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="site-footer-note">
        © {year} {identity.name}. All rights reserved.
      </p>
    </footer>
  )
}
