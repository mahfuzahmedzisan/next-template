import type { Metadata } from "next";

import type { ResolvedSeo } from "@/lib/seo/types";

type OpenGraphType = "website" | "article" | "profile";

export type MetadataOptions = {
  /** Current page of a paginated listing; pages after the first are their own canonical. */
  page?: number;
  /** True when filter or sort query strings are present; those use the base path as canonical. */
  query?: boolean;
};

export function canonicalFor(seo: ResolvedSeo, options: MetadataOptions = {}): string {
  if (options.page && options.page > 1) {
    const url = new URL(seo.canonical_base);
    url.searchParams.set("page", String(options.page));
    return url.toString();
  }

  return options.query ? seo.canonical_base : seo.canonical;
}

/** Maps backend-resolved SEO to Next's Metadata. The title is absolute, so no layout template applies. */
export function toMetadata(seo: ResolvedSeo, options: MetadataOptions = {}): Metadata {
  const canonical = canonicalFor(seo, options);
  const ogType: OpenGraphType = seo.open_graph.type === "article" || seo.open_graph.type === "profile" ? seo.open_graph.type : "website";
  const { image_width: width, image_height: height, image_type: type } = seo.open_graph;
  const image = {
    url: seo.open_graph.image,
    alt: seo.open_graph.image_alt,
    ...(width && height ? { width, height } : {}),
    ...(type ? { type } : {}),
  };
  const robots = seo.robots;

  const openGraph: Metadata["openGraph"] = {
    title: seo.open_graph.title,
    description: seo.open_graph.description ?? undefined,
    url: canonical,
    siteName: seo.open_graph.site_name,
    locale: seo.open_graph.locale,
    images: [image],
    ...(ogType === "article"
      ? {
          type: "article" as const,
          publishedTime: seo.published_time ?? undefined,
          modifiedTime: seo.modified_time ?? undefined,
          authors: seo.author ? [seo.author] : undefined,
        }
      : { type: ogType }),
  };

  return {
    title: { absolute: seo.title },
    description: seo.description ?? undefined,
    keywords: seo.keywords.length > 0 ? seo.keywords : undefined,
    authors: seo.author ? [{ name: seo.author }] : undefined,
    alternates: { canonical },
    robots: {
      index: robots.index,
      follow: robots.follow,
      googleBot: {
        index: robots.index,
        follow: robots.follow,
        "max-image-preview": robots.max_image_preview,
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph,
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description ?? undefined,
      images: [{ url: seo.twitter.image, alt: seo.open_graph.image_alt }],
      site: seo.twitter.site ?? undefined,
      creator: seo.twitter.creator ?? undefined,
    },
  };
}
