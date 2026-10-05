/**
 * Portfolio copy. A section is rendered only when its fields have values.
 * Leave unknown projects, URLs, and contact details unset.
 */
export type ProjectImage = {
  src: string
  width: number
  height: number
  alt: string
}

export type Project = {
  slug: string
  title: string
  summary: string
  tags: readonly string[]
  liveUrl?: string
  sourceUrl?: string
  image?: ProjectImage
  caseStudy?: string
}

export type SiteProfile = {
  label: string
  href: string
}

export const site = {
  name: "Dashboard Layout",
  role: undefined as string | undefined,
  summary: undefined as string | undefined,
  about: [] as readonly string[],
  skills: [] as readonly string[],
  projects: [] as readonly Project[],
  email: undefined as string | undefined,
  profiles: [] as readonly SiteProfile[],
  resumeHref: undefined as string | undefined,
}

export function siteDescription() {
  return site.summary ?? site.role ?? site.name
}

export function siteNav() {
  const items: { href: string; label: string }[] = []

  if (site.about.length > 0 || site.skills.length > 0) {
    items.push({ href: "#about", label: "About" })
  }

  if (site.projects.length > 0) {
    items.push({ href: "#work", label: "Work" })
  }

  if (site.email || site.resumeHref || site.profiles.length > 0) {
    items.push({ href: "#contact", label: "Contact" })
  }

  return items
}

export function hasContact() {
  return Boolean(site.email || site.resumeHref || site.profiles.length > 0)
}
