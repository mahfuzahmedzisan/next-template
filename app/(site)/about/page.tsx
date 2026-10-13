import type { Metadata } from "next"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { CtaSection } from "@/components/site/cta-section"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { aboutPage } from "@/content/pages/about"
import { site } from "@/content/site"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

const PATH = "/about"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo(PATH))
}

export default async function AboutPage() {
  const seo = await fetchPageSeo(PATH)

  return (
    <main id="content" tabIndex={-1} className="site-main gap-20">
      <RouteReady />
      <SeoJsonLd seo={seo} />

      <header className="flex max-w-3xl flex-col gap-5">
        <Breadcrumbs identity={seo.identity} items={[{ name: "About", path: PATH }]} />
        <h1 className="site-h1">{aboutPage.heading}</h1>
        <p className="site-lead">{aboutPage.lead}</p>
      </header>

      <section aria-labelledby="story-heading" className="site-split">
        <h2 id="story-heading" className="site-h2">
          {aboutPage.story.heading}
        </h2>
        <div className="site-copy">
          {[...aboutPage.story.paragraphs, ...site.about].map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="principles-heading" className="flex flex-col gap-8">
        <h2 id="principles-heading" className="site-h2">
          {aboutPage.principles.heading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {aboutPage.principles.items.map((item) => (
            <article key={item.title} className="site-card">
              <h3 className="site-h3">{item.title}</h3>
              <p className="site-small mt-2">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="experience-heading" className="site-split">
        <h2 id="experience-heading" className="site-h2">
          {aboutPage.experience.heading}
        </h2>
        <ol className="site-copy gap-6 border-l border-border/70 pl-6">
          {aboutPage.experience.items.map((item) => (
            <li key={item.title}>
              <h3 className="site-h3 text-base">{item.title}</h3>
              <p className="site-small mt-2">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="skills-heading" className="flex flex-col gap-4">
        <h2 id="skills-heading" className="site-h2">
          Skills and tools
        </h2>
        <p className="site-copy max-w-2xl">
          <span>
            These are the tools we reach for most often. We pick the stack for each project based on your team&apos;s skills and long-term maintenance, not on what is fashionable. See them in action in our{" "}
            <Link href="/projects" className="site-a">
              project case studies
            </Link>{" "}
            or read how we use them on the{" "}
            <Link href="/blog" className="site-a">
              blog
            </Link>
            .
          </span>
        </p>
        <ul className="site-chips">
          {site.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="outside-heading" className="site-copy max-w-3xl">
        <h2 id="outside-heading" className="site-h2">
          {aboutPage.outside.heading}
        </h2>
        <p>{aboutPage.outside.paragraph}</p>
      </section>

      <CtaSection
        heading="Let's work together"
        body="If our way of working sounds right for your team, tell us about your project. We reply within two working days with questions and a suggested first step."
      />
    </main>
  )
}
