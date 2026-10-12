import { site } from "@/content/site"
import type { SeoIdentity } from "@/lib/seo/types"

function personId(origin: string) {
  return `${origin}#person`
}

function websiteId(origin: string) {
  return `${origin}#website`
}

function originOf(identity: SeoIdentity) {
  return identity.site_url.replace(/\/$/, "")
}

export function personSchema(identity: SeoIdentity): Record<string, unknown> {
  const origin = originOf(identity)

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: identity.name,
    "@id": personId(origin),
    url: origin,
    ...(site.role ? { jobTitle: site.role } : {}),
    ...(site.summary ? { description: site.summary } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(site.profiles.length > 0
      ? { sameAs: site.profiles.map((profile) => profile.href) }
      : {}),
    ...(site.skills.length > 0 ? { knowsAbout: [...site.skills] } : {}),
  }
}

export function websiteSchema(
  identity: SeoIdentity,
  description?: string | null,
): Record<string, unknown> {
  const origin = originOf(identity)

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: identity.name,
    ...(description ? { description } : {}),
    "@id": websiteId(origin),
    url: origin,
    inLanguage: identity.locale,
    publisher: { "@id": personId(origin) },
  }
}

/** BreadcrumbList for an inner page; the home page is always the first item. */
export function breadcrumbSchema(
  identity: SeoIdentity,
  items: readonly { name: string; path: string }[],
): Record<string, unknown> {
  const origin = originOf(identity)
  const trail = [{ name: "Home", path: "/" }, ...items]

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path === "/" ? "/" : item.path}`,
    })),
  }
}

export function siteStructuredData(
  identity: SeoIdentity,
  description?: string | null,
): Record<string, unknown>[] {
  return [personSchema(identity), websiteSchema(identity, description)]
}
