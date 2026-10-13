import type { Route } from "next"
import Image from "next/image"
import type { ReactNode } from "react"

import { TransitionLink as Link } from "@/components/transitions/transition-link"
import type { PostCard as Post, ProjectCard as Project } from "@/lib/content/api"

const COVER = { width: 1200, height: 628 }

export function formatDate(value: string | null): string | null {
  if (!value) return null
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value))
}

function Cover({ src, alt, priority }: { src: string | null; alt: string; priority?: boolean }) {
  if (!src) return <div className="site-cover bg-muted" aria-hidden />

  return (
    <Image
      src={src}
      alt={alt}
      width={COVER.width}
      height={COVER.height}
      sizes="(min-width: 1152px) 576px, (min-width: 640px) 50vw, 100vw"
      priority={priority}
      className="site-cover"
    />
  )
}

function Card({
  cover,
  meta,
  title,
  href,
  summary,
  children,
}: {
  cover: ReactNode
  meta: string
  title: string
  href: string
  summary: string
  children?: ReactNode
}) {
  return (
    <article className="site-tile">
      {cover}
      <div className="site-tile-body">
        <p className="site-meta">{meta}</p>
        <h3 className="site-h3">
          <Link href={href as Route} className="site-link">
            {title}
          </Link>
        </h3>
        <p className="site-small">{summary}</p>
        {children}
      </div>
    </article>
  )
}

export function ProjectCard({ project, priority }: { project: Project; priority?: boolean }) {
  return (
    <Card
      cover={<Cover src={project.cover_url} alt={`Cover of the ${project.client ?? project.title} case study`} priority={priority} />}
      meta={[project.client, project.year].filter(Boolean).join(" · ")}
      title={project.title}
      href={project.path}
      summary={project.summary}
    >
      {project.stack.length > 0 ? (
        <ul className="site-chips mt-auto pt-2" aria-label="Stack">
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}

export function PostCard({ post }: { post: Post }) {
  const date = formatDate(post.published_at)

  return (
    <Card
      cover={<Cover src={post.cover_url} alt={`Cover image for "${post.title}"`} />}
      meta={[post.category, date, post.reading_minutes ? `${post.reading_minutes} min read` : null].filter(Boolean).join(" · ")}
      title={post.title}
      href={post.path}
      summary={post.excerpt}
    />
  )
}
