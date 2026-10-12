import type { Route } from "next"

import { JsonLd } from "@/components/seo/json-ld"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import type { SeoIdentity } from "@/lib/seo/types"
import { breadcrumbSchema } from "@/lib/structured-data"

export type Crumb = { name: string; path: string }

/** Visible trail plus matching BreadcrumbList data. The last item is the current page. */
export function Breadcrumbs({ identity, items }: { identity: SeoIdentity; items: readonly Crumb[] }) {
  const trail = [{ name: "Home", path: "/" }, ...items]

  return (
    <>
      <JsonLd data={breadcrumbSchema(identity, items)} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1 text-sm text-muted-foreground">
          {trail.map((item, index) =>
            index === trail.length - 1 ? (
              <li key={item.path} aria-current="page" className="font-medium text-foreground">
                {item.name}
              </li>
            ) : (
              <li key={item.path} className="after:ml-1 after:content-['/']">
                <Link href={item.path as Route} className="site-focus hover:text-foreground hover:underline">
                  {item.name}
                </Link>
              </li>
            ),
          )}
        </ol>
      </nav>
    </>
  )
}
