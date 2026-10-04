import Image from "next/image"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { site, type Project } from "@/content/site"

import { ProjectCaseStudy } from "./project-case-study"

const linkClass =
  "inline-flex min-h-11 items-center rounded-md text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"

function ProjectLinks({ project }: { project: Project }) {
  const links: { href: string; label: string }[] = []

  if (project.liveUrl) {
    links.push({
      href: project.liveUrl,
      label: `Live demo for ${project.title}`,
    })
  }

  if (project.sourceUrl) {
    links.push({
      href: project.sourceUrl,
      label: `Source code for ${project.title}`,
    })
  }

  if (links.length === 0) {
    return null
  }

  return (
    <CardFooter className="gap-4">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {link.label}
        </a>
      ))}
    </CardFooter>
  )
}

export function ProjectList() {
  if (site.projects.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-col gap-4">
      {site.projects.map((project) => (
        <li key={project.slug}>
          <Card>
            {project.image ? (
              <Image
                src={project.image.src}
                alt={project.image.alt}
                width={project.image.width}
                height={project.image.height}
                sizes="(min-width: 48rem) 42rem, 100vw"
              />
            ) : null}
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.summary}</CardDescription>
            </CardHeader>
            {project.tags.length > 0 ? (
              <CardContent>
                <ul className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </CardContent>
            ) : null}
            <ProjectLinks project={project} />
            {project.caseStudy ? (
              <div className="px-(--card-spacing) pb-(--card-spacing)">
                <ProjectCaseStudy
                  title={project.title}
                  caseStudy={project.caseStudy}
                />
              </div>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  )
}
