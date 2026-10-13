import type { Metadata } from "next"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { PostCard } from "@/components/site/content-cards"
import { CtaSection } from "@/components/site/cta-section"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { fetchPosts } from "@/lib/content/api"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

const PATH = "/blog"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo(PATH))
}

export default async function BlogPage() {
  const [seo, posts] = await Promise.all([fetchPageSeo(PATH), fetchPosts()])

  return (
    <main id="content" tabIndex={-1} className="site-main">
      <RouteReady />
      <SeoJsonLd seo={seo} />

      <header className="flex max-w-3xl flex-col gap-5">
        <Breadcrumbs identity={seo.identity} items={[{ name: "Blog", path: PATH }]} />
        <h1 className="site-h1">Notes on building web applications</h1>
        <p className="site-lead">
          Practical articles about Next.js, Laravel, performance, accessibility and technical SEO, written from real client projects. Each post focuses on one problem, explains the trade-offs and ends with steps you can apply to your own product the same week.
        </p>
      </header>

      <section aria-labelledby="posts-heading" className="flex flex-col gap-8">
        <h2 id="posts-heading" className="site-h2s">
          Latest articles
        </h2>
        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="site-copy">The first articles are being written. Please check back soon.</p>
        )}
      </section>

      <section aria-labelledby="topics-heading" className="site-split">
        <h2 id="topics-heading" className="site-h2s">
          What we write about
        </h2>
        <div className="site-copy site-prose">
          <h3>Engineering</h3>
          <p>
            Patterns for structuring Next.js and Laravel projects, caching, background jobs and the small decisions that keep a codebase easy to change.
          </p>
          <h3>Performance and SEO</h3>
          <p>
            How to keep pages fast, measure Core Web Vitals and make sure search engines understand your content. We follow the guidance in{" "}
            <a href="https://developers.google.com/search/docs" className="site-a">
              Google Search Central
            </a>{" "}
            closely.
          </p>
          <h3>Working with clients</h3>
          <p>
            Estimates, weekly releases and handovers that actually work. If a topic is missing,{" "}
            <Link href="/contact" className="site-a">
              suggest one
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaSection />
    </main>
  )
}
