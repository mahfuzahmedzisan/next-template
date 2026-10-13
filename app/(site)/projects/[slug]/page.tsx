import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { CtaSection } from "@/components/site/cta-section"
import { Prose } from "@/components/site/prose"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { fetchProject, fetchProjects } from "@/lib/content/api"
import { toMetadata } from "@/lib/seo/metadata"

export async function generateStaticParams() {
  const projects = await fetchProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = await fetchProject((await params).slug)
  return project ? toMetadata(project.seo) : {}
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const project = await fetchProject((await params).slug)
  if (!project) notFound()

  const facts = [
    { label: "Client", value: project.client },
    { label: "Year", value: project.year ? String(project.year) : null },
    { label: "Stack", value: project.stack.join(", ") || null },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value))

  return (
    <main id="content" tabIndex={-1} className="site-main max-w-4xl gap-12">
      <RouteReady />
      <SeoJsonLd seo={project.seo} />

      <header className="flex flex-col gap-5">
        <Breadcrumbs
          identity={project.seo.identity}
          items={[
            { name: "Projects", path: "/projects" },
            { name: project.title, path: project.path },
          ]}
        />
        <h1 className="site-h1">{project.title}</h1>
        <p className="site-lead">{project.summary}</p>
        {project.live_url || project.source_url ? (
          <div className="flex flex-wrap gap-3">
            {project.live_url ? (
              <a href={project.live_url} target="_blank" rel="noopener" className="site-btn">
                Visit the live site <ExternalLink aria-hidden />
              </a>
            ) : null}
            {project.source_url ? (
              <a href={project.source_url} target="_blank" rel="noopener" className="site-btn-outline">
                View the source <ExternalLink aria-hidden />
              </a>
            ) : null}
          </div>
        ) : null}
      </header>

      {project.cover_url ? (
        <Image
          src={project.cover_url}
          alt={`Cover of the ${project.client ?? project.title} case study`}
          width={1200}
          height={628}
          sizes="(min-width: 896px) 848px, 100vw"
          priority
          className="site-cover rounded-2xl border border-border/70"
        />
      ) : null}

      {facts.length > 0 ? (
        <dl className="site-card grid gap-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="site-meta">{fact.label}</dt>
              <dd className="mt-1 text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <Prose body={project.body} />

      <p className="site-small">
        <Link href="/projects" className="site-a">
          Back to all projects
        </Link>
        {" · "}
        <Link href="/services" className="site-a">
          See related services
        </Link>
      </p>

      <CtaSection />
    </main>
  )
}
