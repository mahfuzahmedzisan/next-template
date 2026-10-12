export type SeoIdentity = {
  name: string;
  short_name: string;
  site_url: string;
  logo_url: string | null;
  locale: string;
};

/** Resolved SEO for one URL, as returned by `GET /api/v1/seo/page`. */
export type ResolvedSeo = {
  kind: "page" | "model";
  type: string | null;
  id: number | null;
  path: string;
  page_type: string;
  registered: boolean;
  title: string;
  raw_title: string;
  description: string | null;
  keywords: string[];
  author: string | null;
  canonical: string;
  canonical_base: string;
  self_canonical: boolean;
  robots: { index: boolean; follow: boolean; max_image_preview: "none" | "standard" | "large" };
  open_graph: {
    title: string;
    description: string | null;
    image: string;
    /** Set when the backend knows the real size (its 1200x628 variant or the /og card). */
    image_width?: number | null;
    image_height?: number | null;
    image_type?: string | null;
    image_alt: string;
    type: string;
    locale: string;
    site_name: string;
    url: string;
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string | null;
    image: string;
    site: string | null;
    creator: string | null;
  };
  published_time: string | null;
  modified_time: string | null;
  schema: { type: string; json_ld: Record<string, unknown> };
  sitemap: { include: boolean; priority: number; changefreq: string; lastmod: string | null };
  identity: SeoIdentity;
  /** Set only on the local fallback used while the API is unreachable. */
  fallback?: true;
};
