import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { SeoJsonLd } from "@/components/seo/json-ld"
import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { formatDate } from "@/components/site/content-cards"
import { CtaSection } from "@/components/site/cta-section"
import { Prose } from "@/components/site/prose"
import { RouteReady } from "@/components/transitions/route-ready"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { fetchPost, fetchPosts } from "@/lib/content/api"
import { toMetadata } from "@/lib/seo/metadata"

export async function generateStaticParams() {
  const posts = await fetchPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await fetchPost((await params).slug)
  return post ? toMetadata(post.seo) : {}
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = await fetchPost((await params).slug)
  if (!post) notFound()

  const published = formatDate(post.published_at)
  const meta = [post.author ? `By ${post.author}` : null, post.category, post.reading_minutes ? `${post.reading_minutes} min read` : null]
    .filter(Boolean)
    .join(" · ")

  return (
    <main id="content" tabIndex={-1} className="site-main max-w-3xl gap-10">
      <RouteReady />
      <SeoJsonLd seo={post.seo} />

      <header className="flex flex-col gap-5">
        <Breadcrumbs
          identity={post.seo.identity}
          items={[
            { name: "Blog", path: "/blog" },
            { name: post.title, path: post.path },
          ]}
        />
        <h1 className="site-h1 md:text-4xl">{post.title}</h1>
        <p className="site-small">
          {meta}
          {published && post.published_at ? (
            <>
              {" · "}
              <time dateTime={post.published_at}>{published}</time>
            </>
          ) : null}
        </p>
        <p className="site-lead">{post.excerpt}</p>
      </header>

      {post.cover_url ? (
        <Image
          src={post.cover_url}
          alt={`Cover image for "${post.title}"`}
          width={1200}
          height={628}
          sizes="(min-width: 768px) 720px, 100vw"
          priority
          className="site-cover rounded-2xl border border-border/70"
        />
      ) : null}

      <article>
        <Prose body={post.body} />
      </article>

      {post.tags.length > 0 ? (
        <ul className="site-chips" aria-label="Tags">
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}

      <p className="site-small">
        <Link href="/blog" className="site-a">
          Back to all articles
        </Link>
        {" · "}
        <Link href="/projects" className="site-a">
          See related projects
        </Link>
      </p>

      <CtaSection />
    </main>
  )
}
