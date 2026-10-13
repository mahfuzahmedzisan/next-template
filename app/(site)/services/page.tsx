import type { Metadata } from "next"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { CtaSection } from "@/components/site/cta-section"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { services, servicesFaq, servicesPage } from "@/content/pages/services"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

const PATH = "/services"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo(PATH))
}

export default async function ServicesPage() {
  const seo = await fetchPageSeo(PATH)

  return (
    <main id="content" tabIndex={-1} className="site-main gap-20">
      <RouteReady />
      <SeoJsonLd seo={seo} />

      <header className="flex max-w-3xl flex-col gap-5">
        <Breadcrumbs identity={seo.identity} items={[{ name: "Services", path: PATH }]} />
        <h1 className="site-h1">{servicesPage.title}</h1>
        <p className="site-lead">{servicesPage.intro}</p>
      </header>

      {services.map((service) => (
        <section key={service.slug} id={service.slug} aria-labelledby={`${service.slug}-h`} className="site-split scroll-mt-24">
          <h2 id={`${service.slug}-h`} className="site-h2">
            {service.title}
          </h2>
          <div className="site-copy site-prose">
            {service.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <h3>What you get</h3>
            <ul>
              {service.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <section aria-labelledby="engagement-heading" className="flex flex-col gap-8">
        <div className="max-w-2xl">
          <h2 id="engagement-heading" className="site-h2">
            Ways to work together
          </h2>
          <p className="site-copy mt-3">
            <span>
              Pick the format that matches where your product is today. You can switch later; many clients start with an audit and continue with a project. See the results of past engagements in the{" "}
              <Link href="/projects" className="site-a">
                project case studies
              </Link>
              .
            </span>
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {servicesPage.approach.map((item) => (
            <article key={item.title} className="site-card">
              <h3 className="site-h3">{item.title}</h3>
              <p className="site-small mt-2">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="services-faq-heading" className="site-split">
        <h2 id="services-faq-heading" className="site-h2">
          {servicesFaq.heading}
        </h2>
        <div className="site-copy site-prose">
          {servicesFaq.items.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaSection
        heading="Not sure which service fits?"
        body="Describe the problem in a few sentences and we will suggest the smallest engagement that could solve it, with an honest estimate and no obligation."
      />
    </main>
  )
}
