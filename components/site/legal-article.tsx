import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { formatDate } from "@/components/site/content-cards"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import type { LegalPage } from "@/content/pages/legal"
import type { ResolvedSeo } from "@/lib/seo/types"

export function LegalArticle({ page, path, seo }: { page: LegalPage; path: string; seo: ResolvedSeo }) {
  return (
    <main id="content" tabIndex={-1} className="site-main max-w-3xl gap-10">
      <RouteReady />
      <SeoJsonLd seo={seo} />

      <header className="flex flex-col gap-5">
        <Breadcrumbs identity={seo.identity} items={[{ name: page.heading, path }]} />
        <h1 className="site-h1">{page.heading}</h1>
        <p className="site-small">
          Last updated <time dateTime={page.updated}>{formatDate(page.updated)}</time>
        </p>
        <p className="site-lead">{page.intro}</p>
      </header>

      <article className="site-copy site-prose">
        {page.sections.map((section) => (
          <section key={section.heading} className="site-copy">
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items?.map((item) => (
              <div key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </section>
        ))}
      </article>

      <p className="site-small border-t border-border/70 pt-6">
        Questions about this page?{" "}
        <Link href="/contact" className="site-a">
          Get in touch
        </Link>{" "}
        and we will answer as soon as we can.
      </p>
    </main>
  )
}
