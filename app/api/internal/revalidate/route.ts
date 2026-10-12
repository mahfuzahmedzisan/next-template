import { createHash, timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"

const MAX_TAGS = 20
const ALLOWED_TAG = /^(seo|seo-files|(project|post|product|blog):[A-Za-z0-9_-]{1,64})$/

function sameSecret(given: string | null, expected: string): boolean {
  if (!given) return false
  const a = createHash("sha256").update(given).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

/** Called by the Laravel API after SEO data changes; only cache tags on the allow-list are accepted. */
export async function POST(request: Request) {
  const secret = process.env.BFF_SECRET
  if (!secret || !sameSecret(request.headers.get("x-bff-secret"), secret)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  let tags: unknown
  try {
    tags = ((await request.json()) as { tags?: unknown }).tags
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 })
  }

  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    tags.length > MAX_TAGS ||
    !tags.every((tag) => typeof tag === "string" && ALLOWED_TAG.test(tag))
  ) {
    return Response.json({ message: "Invalid tags" }, { status: 422 })
  }

  for (const tag of new Set(tags as string[])) {
    revalidateTag(tag, "max")
  }

  return new Response(null, { status: 204 })
}
