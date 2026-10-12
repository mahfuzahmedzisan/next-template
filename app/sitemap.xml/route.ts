import { proxySeoFile } from "@/lib/seo/files"

export const dynamic = "force-dynamic"

export function GET() {
  return proxySeoFile("sitemap.xml", { contentType: "application/xml; charset=utf-8" })
}
