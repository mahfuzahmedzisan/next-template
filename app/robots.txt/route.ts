import { fallbackRobots, proxySeoFile } from "@/lib/seo/files"

export const dynamic = "force-dynamic"

export function GET() {
  return proxySeoFile("robots.txt", {
    contentType: "text/plain; charset=utf-8",
    fallback: fallbackRobots,
  })
}
