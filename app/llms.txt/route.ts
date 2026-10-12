import { proxySeoFile } from "@/lib/seo/files"

export const dynamic = "force-dynamic"

export function GET() {
  return proxySeoFile("llms.txt", { contentType: "text/plain; charset=utf-8" })
}
