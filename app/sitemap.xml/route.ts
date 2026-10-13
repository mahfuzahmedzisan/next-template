import { fallbackSitemap, proxySeoFile } from "@/lib/seo/files"

export const revalidate = 0

export function GET() {
  return proxySeoFile("sitemap.xml", {
    contentType: "application/xml; charset=utf-8",
    fallback: fallbackSitemap,
  })
}
