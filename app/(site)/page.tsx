import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { PostCard, ProjectCard } from "@/components/site/content-cards"
import { CtaSection } from "@/components/site/cta-section"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { homePage } from "@/content/pages/home"
import { services } from "@/content/pages/services"
import { site } from "@/content/site"
import { fetchPosts, fetchProjects } from "@/lib/content/api"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo("/"))
}

function SectionHead({ id, title, intro, more }: { id: string; title: string; intro: string; more?: { href: "/services" | "/projects" | "/blog"; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2 id={id} className="site-h2">
          {title}
        </h2>
        <p className="site-copy mt-3">{intro}</p>
      </div>
      {more ? (
        <Link href={more.href} className="site-more">
          {more.label} <ArrowRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-8">
      {children}
    </section>
  )
}

export default async function Home() {
  const [seo, projects, posts] = await Promise.all([
    fetchPageSeo("/"),
    fetchProjects({ featured: true, perPage: 4 }),
    fetchPosts({ perPage: 3 }),
  ])

  return (
    <main id="content" tabIndex={-1} className="site-main gap-24 md:py-24">
      <RouteReady />
      <SeoJsonLd seo={seo} />

      <section aria-labelledby="home-heading" className="site-reveal max-w-3xl">
        <p className="site-small font-medium">{homePage.eyebrow}</p>
        <h1 id="home-heading" className="site-h1 mt-3">
          {homePage.heading}
        </h1>
        <p className="site-lead mt-5 max-w-2xl">{homePage.lead}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contact" className="site-btn">
            Start a project
          </Link>
          <Link href="/projects" className="site-btn-outline">
            See our work
          </Link>
        </div>
      </section>

      <section aria-labelledby="intro-heading" className="site-split">
        <h2 id="intro-heading" className="site-h2">
          {homePage.intro.heading}
        </h2>
        <div className="site-copy">
          {homePage.intro.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            Want the longer version? Read more{" "}
            <Link href="/about" className="site-a">
              about the studio and how we work
            </Link>
            .
          </p>
        </div>
      </section>

      <Section id="services-heading">
        <SectionHead
          id="services-heading"
          title="What we can help with"
          intro="Four kinds of work make up most of our projects. Many clients start with one and add another once the first release is live."
          more={{ href: "/services", label: "All services" }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <article key={service.slug} className="site-card">
              <h3 className="site-h3">{service.title}</h3>
              <p className="site-small mt-2">{service.short}</p>
            </article>
          ))}
        </div>
      </Section>

      {projects.length > 0 ? (
        <Section id="work-heading">
          <SectionHead
            id="work-heading"
            title="Selected projects"
            intro="A few recent case studies, each with the problem, the approach and the results in numbers."
            more={{ href: "/projects", label: "All projects" }}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} priority={index === 0} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section id="process-heading">
        <SectionHead id="process-heading" title={homePage.process.heading} intro={homePage.process.intro} />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {homePage.process.steps.map((step) => (
            <li key={step.title} className="site-card">
              <h3 className="site-h3">{step.title}</h3>
              <p className="site-small mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {posts.length > 0 ? (
        <Section id="writing-heading">
          <SectionHead
            id="writing-heading"
            title="Latest writing"
            intro="Practical notes on building, shipping and maintaining web applications."
            more={{ href: "/blog", label: "All posts" }}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </Section>
      ) : null}

      <section aria-labelledby="faq-heading" className="site-split">
        <div>
          <h2 id="faq-heading" className="site-h2">
            {homePage.faq.heading}
          </h2>
          <p className="site-copy mt-3">
            <span>
              Something else on your mind?{" "}
              <Link href="/contact" className="site-a">
                Ask us directly
              </Link>
              .
            </span>
          </p>
        </div>
        <div className="site-copy">
          {homePage.faq.items.map((item) => (
            <div key={item.question}>
              <h3 className="site-h3 text-base">{item.question}</h3>
              <p className="site-small mt-2">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="skills-heading" className="flex flex-col gap-4">
        <h2 id="skills-heading" className="site-h2s">
          Tools we use every day
        </h2>
        <ul className="site-chips">
          {site.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
        <p className="site-small max-w-2xl">
          We follow the official{" "}
          <a href="https://nextjs.org/docs" className="site-a">
            Next.js documentation
          </a>{" "}
          and{" "}
          <a href="https://laravel.com/docs" className="site-a">
            Laravel documentation
          </a>{" "}
          closely and keep every project on supported versions.
        </p>
      </section>

      <CtaSection heading={homePage.cta.heading} body={homePage.cta.body} />
    </main>
  )
}
