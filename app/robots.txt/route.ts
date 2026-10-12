import { fallbackRobots, proxySeoFile } from "@/lib/seo/files"

export const revalidate = 0

export function GET() {
  return proxySeoFile("robots.txt", {
    contentType: "text/plain; charset=utf-8",
    fallback: fallbackRobots,
  })
}
