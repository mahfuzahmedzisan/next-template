import type { ResolvedSeo } from "@/lib/seo/types"

type JsonLdValue = Record<string, unknown>

/**
 * Renders a schema.org block. The `<` escape stops a stray `</script>`
 * inside copy from closing the tag early.
 */
export function JsonLd({ data }: { data: JsonLdValue | JsonLdValue[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}

/** The page-level schema resolved by the backend for this URL. */
export function SeoJsonLd({ seo }: { seo: ResolvedSeo }) {
  return <JsonLd data={seo.schema.json_ld} />
}
