import "server-only";

import { SeoFetchError, seoFetch, seoPrimaryOrigin } from "@/lib/seo/api";

const PUBLIC_CACHE = "public, max-age=300";
const FILE_TAG = "seo-files";
const FILE_REVALIDATE_SECONDS = 3600;

type ProxyOptions = {
  contentType: string;
  /** Served with 200 when the backend is unavailable; without it the route answers 503. */
  fallback?: () => string;
};

/**
 * Serves a backend-generated SEO file (sitemap, robots, llms) to crawlers.
 * The upstream copy is cached under the `seo-files` tag, which the backend
 * revalidates after it regenerates the files. Route handlers using this
 * export `revalidate = 0` so the outage fallback still runs per request.
 */
export async function proxySeoFile(file: string, { contentType, fallback }: ProxyOptions): Promise<Response> {
  try {
    const upstream = await seoFetch(`/seo/${file}`, {
      headers: { Accept: "*/*" },
      next: { tags: [FILE_TAG], revalidate: FILE_REVALIDATE_SECONDS },
    });

    return new Response(await upstream.text(), {
      headers: { "Content-Type": contentType, "Cache-Control": PUBLIC_CACHE },
    });
  } catch (error) {
    if (error instanceof SeoFetchError && error.status === 404) {
      return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    if (fallback) {
      return new Response(fallback(), {
        headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
      });
    }

    return new Response("Temporarily unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "300" },
    });
  }
}

/** Safe robots.txt for API outages: keeps private areas out without blocking the site. */
export function fallbackRobots(): string {
  const origin = seoPrimaryOrigin();

  return [
    "User-agent: *",
    "Allow: /api/storage/",
    "Allow: /og",
    "Disallow: /admin",
    "Disallow: /api/",
    "Allow: /",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}
