/**
 * Portfolio profile. This is demo copy; replace it with real details.
 * Projects and blog posts come from the API, not from this file.
 */
export type SiteProfile = {
  label: string
  href: string
}

export type NavItem = {
  href: string
  label: string
}

export const site = {
  name: "Next Template",
  role: "Next.js and Laravel web studio" as string | undefined,
  summary:
    "A small web studio building fast, accessible web apps with Next.js and Laravel, from first sketch to production support." as
      | string
      | undefined,
  location: "Remote-first team" as string | undefined,
  availability: "Taking on new projects for the next quarter.",
  about: [
    "We design and build web applications for small teams that need software to remove friction from their day: dashboards that replace spreadsheets, booking systems that cut phone calls, and portals that make information easy to find.",
    "Most of our work pairs a Next.js front end with a Laravel API. We care about the parts users never notice until they go wrong: fast first loads, clear errors, accessible controls and data that is never lost.",
  ] as readonly string[],
  skills: [
    "Next.js",
    "React",
    "TypeScript",
    "Laravel",
    "PHP",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Tailwind CSS",
    "Accessibility",
    "Technical SEO",
  ] as readonly string[],
  email: "hello@example.com" as string | undefined,
  profiles: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
  ] as readonly SiteProfile[],
  resumeHref: undefined as string | undefined,
}

export function siteDescription() {
  return site.summary ?? site.role ?? site.name
}

export const primaryNav: readonly NavItem[] = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
]

export const legalNav: readonly NavItem[] = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
]

export function hasContact() {
  return Boolean(site.email || site.resumeHref || site.profiles.length > 0)
}
