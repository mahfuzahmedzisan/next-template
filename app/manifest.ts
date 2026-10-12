import type { MetadataRoute } from "next";

import { siteDescription } from "@/content/site";
import { fetchBrandIcons } from "@/lib/brand/icons";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await fetchBrandIcons();
  const v = `?v=${brand.version}`;

  return {
    name: brand.name,
    short_name: brand.shortName,
    description: siteDescription(),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      { src: `/brand/icon-192.png${v}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/brand/icon-512.png${v}`, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
