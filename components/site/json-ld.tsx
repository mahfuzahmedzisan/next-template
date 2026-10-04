import { site } from "@/content/site"
import { siteOrigin } from "@/lib/site-url"

type JsonLdNode = Record<string, string | string[]>

export function JsonLd() {
  const origin = siteOrigin()

  const person: JsonLdNode = {
    "@type": "Person",
    name: site.name,
  }

  if (site.role) {
    person.jobTitle = site.role
  }

  if (site.email) {
    person.email = site.email
  }

  if (site.profiles.length > 0) {
    person.sameAs = site.profiles.map((profile) => profile.href)
  }

  if (origin) {
    person.url = origin
  }

  const website: JsonLdNode = {
    "@type": "WebSite",
    name: site.name,
  }

  if (origin) {
    website.url = origin
  }

  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [person, website],
  }).replace(/</g, "\\u003c")

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  )
}
