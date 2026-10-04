import { site } from "@/content/site"

const linkClass =
  "inline-flex min-h-11 items-center rounded-md text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"

export function ContactLinks() {
  const links: { href: string; label: string; download?: boolean }[] = []

  if (site.email) {
    links.push({
      href: `mailto:${site.email}`,
      label: `Email ${site.name}`,
    })
  }

  for (const profile of site.profiles) {
    links.push({ href: profile.href, label: profile.label })
  }

  if (site.resumeHref) {
    links.push({
      href: site.resumeHref,
      label: "Resume",
      download: site.resumeHref.startsWith("/"),
    })
  }

  if (links.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            className={linkClass}
            download={link.download || undefined}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
