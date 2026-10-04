import { site, siteDescription, type Project } from "@/content/site"
import { siteOrigin } from "@/lib/site-url"

function personId(origin: string) {
  return `${origin}#person`
}

function websiteId(origin: string) {
  return `${origin}#website`
}

export function personSchema(): Record<string, unknown> {
  const origin = siteOrigin()

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    ...(origin ? { "@id": personId(origin), url: origin } : {}),
    ...(site.role ? { jobTitle: site.role } : {}),
    ...(site.summary ? { description: site.summary } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(site.profiles.length > 0
      ? { sameAs: site.profiles.map((profile) => profile.href) }
      : {}),
    ...(site.skills.length > 0 ? { knowsAbout: [...site.skills] } : {}),
  }
}

export function websiteSchema(): Record<string, unknown> {
  const origin = siteOrigin()

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    description: siteDescription(),
    ...(origin
      ? {
          "@id": websiteId(origin),
          url: origin,
          publisher: { "@id": personId(origin) },
        }
      : {}),
  }
}

export function projectSchema(
  project: Project,
  pageUrl?: string,
): Record<string, unknown> {
  const origin = siteOrigin()

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: project.title,
    description: project.summary,
    ...(pageUrl ? { url: pageUrl } : {}),
    ...(project.image ? { image: project.image.src } : {}),
    ...(project.tags.length > 0 ? { keywords: [...project.tags] } : {}),
    author: origin
      ? { "@id": personId(origin) }
      : { "@type": "Person", name: site.name },
    ...(origin ? { isPartOf: { "@id": websiteId(origin) } } : {}),
  }
}

export function siteStructuredData(): Record<string, unknown>[] {
  return [
    personSchema(),
    websiteSchema(),
    ...site.projects.map((project) => {
      const origin = siteOrigin()
      const pageUrl = origin ? `${origin}/#${project.slug}` : undefined
      return projectSchema(project, pageUrl)
    }),
  ]
}
