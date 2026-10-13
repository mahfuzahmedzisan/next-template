import "server-only";

import { cache } from "react";

import { site, siteDescription } from "@/content/site";
import { SeoFetchError, isLocalOrigin, seoFetch, seoPrimaryOrigin } from "@/lib/seo/api";
import type { ResolvedSeo, SeoIdentity } from "@/lib/seo/types";

const SEO_TAG = "seo";
const SEO_REVALIDATE_SECONDS = 3600;

type PageSeoBody = { data?: { seo?: ResolvedSeo } };

/**
 * Backend-resolved SEO for a site path. Successful responses are cached under
 * the `seo` tag; the backend revalidates the tag whenever SEO data changes.
 * Memoized per request: the root layout, its metadata and the page all ask for it.
 */
export const fetchPageSeo = cache(async (path: string): Promise<ResolvedSeo> => {
  try {
    const response = await seoFetch(`/seo/page?path=${encodeURIComponent(path)}`, {
      next: { tags: [SEO_TAG], revalidate: SEO_REVALIDATE_SECONDS },
    });
    const body = (await response.json()) as PageSeoBody;
    if (body.data?.seo) return withPublicOrigin(body.data.seo);
  } catch (error) {
    if (!(error instanceof SeoFetchError) && process.env.NODE_ENV !== "production") {
      console.warn("[seo] page lookup failed", error);
    }
  }

  return fallbackSeo(path);
});

export async function fetchSiteIdentity(): Promise<SeoIdentity> {
  return (await fetchPageSeo("/")).identity;
}

/**
 * A production build must never publish localhost canonical, OG or JSON-LD
 * URLs, even when the backend's Site URL is still misconfigured.
 */
export function withPublicOrigin(seo: ResolvedSeo): ResolvedSeo {
  const local = seo.identity.site_url.replace(/\/+$/, "");
  const primary = seoPrimaryOrigin();
  if (process.env.NODE_ENV !== "production" || !isLocalOrigin(local) || isLocalOrigin(primary)) {
    return seo;
  }

  return JSON.parse(JSON.stringify(seo).replaceAll(local, primary)) as ResolvedSeo;
}

/** Used only while the API is unreachable; it is never cached. */
function fallbackSeo(path: string): ResolvedSeo {
  const origin = seoPrimaryOrigin();
  const url = new URL(path, origin).toString();
  const description = siteDescription();
  const title = path === "/" ? site.name : `${headline(path)} - ${site.name}`;
  const image = `${origin}/og`;

  return {
    kind: "page",
    type: null,
    id: null,
    path,
    page_type: "other",
    registered: false,
    title,
    raw_title: title,
    description,
    keywords: [],
    author: null,
    canonical: url,
    canonical_base: url,
    self_canonical: true,
    robots: { index: true, follow: true, max_image_preview: "large" },
    open_graph: {
      title,
      description,
      image,
      image_width: 1200,
      image_height: 628,
      image_type: "image/png",
      image_alt: site.name,
      type: "website",
      locale: "en_US",
      site_name: site.name,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image,
      site: null,
      creator: null,
    },
    published_time: null,
    modified_time: null,
    schema: {
      type: "WebPage",
      json_ld: { "@context": "https://schema.org", "@type": "WebPage", name: title, url },
    },
    sitemap: { include: false, priority: 0.5, changefreq: "monthly", lastmod: null },
    identity: { name: site.name, short_name: site.name, site_url: origin, logo_url: null, locale: "en" },
    fallback: true,
  };
}

function headline(path: string): string {
  const segment = path.split("/").filter(Boolean).pop() ?? "";
  return segment.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || site.name;
}
