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
