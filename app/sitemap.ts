import type { MetadataRoute } from "next"

import { siteOrigin } from "@/lib/site-url"

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin()

  if (!origin) {
    return []
  }

  return [
    {
      url: origin,
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
