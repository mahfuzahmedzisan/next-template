import type { Metadata } from "next"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { ProjectCard } from "@/components/site/content-cards"
import { CtaSection } from "@/components/site/cta-section"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { fetchProjects } from "@/lib/content/api"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

const PATH = "/projects"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo(PATH))
}

export default async function ProjectsPage() {
  const [seo, projects] = await Promise.all([fetchPageSeo(PATH), fetchProjects()])

  return (
    <main id="content" tabIndex={-1} className="site-main">
      <RouteReady />
      <SeoJsonLd seo={seo} />

      <header className="flex max-w-3xl flex-col gap-5">
        <Breadcrumbs identity={seo.identity} items={[{ name: "Projects", path: PATH }]} />
        <h1 className="site-h1">Projects and case studies</h1>
        <p className="site-lead">
          A selection of web applications, portals and integrations we have designed and built. Each case study explains the problem, the approach, the technical decisions and the results measured after launch, so you can judge whether our way of working fits your team.
        </p>
      </header>

      <section aria-labelledby="all-projects-heading" className="flex flex-col gap-8">
        <h2 id="all-projects-heading" className="site-h2s">
          All projects
        </h2>
        {projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} priority={index < 3} />
            ))}
          </div>
        ) : (
          <p className="site-copy">New case studies are on the way. Please check back soon.</p>
        )}
      </section>

      <section aria-labelledby="approach-heading" className="site-split">
        <h2 id="approach-heading" className="site-h2s">
          What every project has in common
        </h2>
        <div className="site-copy site-prose">
          <p>
            The industries differ, but the approach stays the same. Every project starts by watching how the work happens today and agreeing on the numbers that should change. The first release is kept deliberately small, so real users can try it within weeks rather than months.
          </p>
          <h3>Measured results</h3>
          <p>
            Each case study reports what changed after launch, such as hours saved per week, fewer support calls or faster page loads. When results are still being measured, the case study says so.
          </p>
          <h3>Built to be handed over</h3>
          <p>
            Clients own their code and infrastructure. Every project ends with documentation, a runbook and a handover session. Learn more about the{" "}
            <Link href="/services" className="site-a">
              services behind these projects
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaSection
        heading="Want results like these?"
        body="Tell us about the workflow that slows your team down. We will reply with questions and an honest view on what a first release could look like."
      />
    </main>
  )
}
