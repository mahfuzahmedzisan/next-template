import { site, type Project } from "@/content/site"
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

export function projectSchema(
  identity: SeoIdentity,
  project: Project,
  pageUrl?: string,
): Record<string, unknown> {
  const origin = originOf(identity)

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: project.title,
    description: project.summary,
    ...(pageUrl ? { url: pageUrl } : {}),
    ...(project.image ? { image: project.image.src } : {}),
    ...(project.tags.length > 0 ? { keywords: [...project.tags] } : {}),
    author: { "@id": personId(origin) },
    isPartOf: { "@id": websiteId(origin) },
  }
}

export function siteStructuredData(
  identity: SeoIdentity,
  description?: string | null,
): Record<string, unknown>[] {
  const origin = originOf(identity)

  return [
    personSchema(identity),
    websiteSchema(identity, description),
    ...site.projects.map((project) =>
      projectSchema(identity, project, `${origin}/#${project.slug}`),
    ),
  ]
}
