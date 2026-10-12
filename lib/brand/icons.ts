import "server-only";

import { createHash } from "node:crypto";

import { formatMediaUrl } from "@/lib/media/media-url";
import { seoFetch } from "@/lib/seo/api";

const BRAND_TAG = "seo";
const BRAND_REVALIDATE_SECONDS = 3600;

export type FaviconSetKey = "favicon_ico" | "icon_192" | "icon_512" | "apple_touch_icon";

export type BrandIcons = {
  name: string;
  shortName: string;
  /** Same-origin or external URL of the admin's uploaded favicon. */
  faviconUrl: string | null;
  /** Files the API generated from a raster favicon; null for SVG or no favicon. */
  set: Partial<Record<FaviconSetKey, string>> | null;
  /** Changes whenever the favicon does, for cache-busting icon links. */
  version: string;
};

type PublicSettingsBody = {
  data?: {
    settings?: {
      name?: string;
      short_name?: string;
      favicon_url?: string | null;
      favicon_set?: Partial<Record<FaviconSetKey, string>> | null;
    };
  };
};

/** Brand data for icons. Cached under the `seo` tag, which the API revalidates on every favicon change. */
export async function fetchBrandIcons(): Promise<BrandIcons> {
  let settings: NonNullable<PublicSettingsBody["data"]>["settings"];

  try {
    const response = await seoFetch("/settings/public", {
      next: { tags: [BRAND_TAG], revalidate: BRAND_REVALIDATE_SECONDS },
    });
    settings = ((await response.json()) as PublicSettingsBody).data?.settings;
  } catch {
    settings = undefined;
  }

  const name = settings?.name?.trim() || "Workspace";
  const faviconUrl = formatMediaUrl(settings?.favicon_url);
  const set = settings?.favicon_set
    ? Object.fromEntries(
        Object.entries(settings.favicon_set).flatMap(([key, value]) => {
          const url = formatMediaUrl(value);
          return url ? [[key, url]] : [];
        }),
      )
    : null;

  return {
    name,
    shortName: settings?.short_name?.trim() || name,
    faviconUrl,
    set: set && Object.keys(set).length > 0 ? set : null,
    version: createHash("sha1")
      .update(`${name}|${faviconUrl ?? ""}|${set?.favicon_ico ?? ""}`)
      .digest("hex")
      .slice(0, 10),
  };
}

/**
 * Bytes of a brand image. `/api/storage/...` paths are read straight from the
 * API so the request never loops back through this app.
 */
export async function fetchBrandBytes(url: string): Promise<Uint8Array | null> {
  const base = process.env.LARAVEL_API_URL?.replace(/\/$/, "");
  const target = url.startsWith("/api/storage/")
    ? base
      ? `${base}/storage/${url.slice("/api/storage/".length)}`
      : null
    : /^https?:\/\//i.test(url)
      ? url
      : null;
  if (!target) return null;

  try {
    const response = await fetch(target, {
      next: { tags: [BRAND_TAG], revalidate: BRAND_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    return bytes.byteLength > 0 && bytes.byteLength <= 5 * 1024 * 1024 ? bytes : null;
  } catch {
    return null;
  }
}
