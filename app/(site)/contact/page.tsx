import type { Metadata } from "next"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { ContactForm } from "@/components/site/contact-form"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { contactPage } from "@/content/pages/contact"
import { site } from "@/content/site"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

const PATH = "/contact"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo(PATH))
}

export default async function ContactPage() {
  const seo = await fetchPageSeo(PATH)

  return (
    <main id="content" tabIndex={-1} className="site-main">
      <RouteReady />
      <SeoJsonLd seo={seo} />

      <header className="flex max-w-3xl flex-col gap-5">
        <Breadcrumbs identity={seo.identity} items={[{ name: "Contact", path: PATH }]} />
        <h1 className="site-h1">{contactPage.heading}</h1>
        <p className="site-lead">{contactPage.lead}</p>
      </header>

      <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="message-heading" className="site-card md:p-8">
          <h2 id="message-heading" className="site-h2s mb-4">
            Send a message
          </h2>
          {site.email ? <ContactForm email={site.email} /> : null}
        </section>

        <section aria-labelledby="next-heading" className="site-copy site-prose">
          <h2 id="next-heading">{contactPage.next.heading}</h2>
          <ol className="site-copy border-l border-border/70 pl-6">
            {contactPage.next.steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="prepare-heading" className="site-copy site-prose max-w-3xl">
        <h2 id="prepare-heading">{contactPage.prepare.heading}</h2>
        <p>{contactPage.prepare.intro}</p>
        <ul>
          {contactPage.prepare.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="details-heading" className="site-copy site-prose max-w-3xl">
        <h2 id="details-heading">{contactPage.details.heading}</h2>
        <p>{contactPage.details.paragraph}</p>
        <p>{contactPage.details.availability}</p>
        <ul className="list-none pl-0">
          {site.email ? (
            <li>
              Email:{" "}
              <a href={`mailto:${site.email}`} className="site-a">
                {site.email}
              </a>
            </li>
          ) : null}
          {site.profiles.map((profile) => (
            <li key={profile.href}>
              {profile.label}:{" "}
              <a href={profile.href} rel="me noopener" target="_blank" className="site-a">
                {profile.href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </li>
          ))}
        </ul>
        <p className="site-small">
          Before you write, you might want to look at the{" "}
          <Link href="/services" className="site-a">
            services we offer
          </Link>{" "}
          or a few{" "}
          <Link href="/projects" className="site-a">
            recent projects
          </Link>
          . Your message is handled as described in the{" "}
          <Link href="/privacy-policy" className="site-a">
            privacy policy
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
