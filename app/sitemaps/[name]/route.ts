import { proxySeoFile } from "@/lib/seo/files"

export const revalidate = 0

export async function GET(_request: Request, ctx: RouteContext<"/sitemaps/[name]">) {
  const { name } = await ctx.params

  if (!/^sitemap-\d+\.xml$/.test(name)) {
    return new Response("Not found", { status: 404 })
  }

  return proxySeoFile(`sitemaps/${name}`, { contentType: "application/xml; charset=utf-8" })
}
