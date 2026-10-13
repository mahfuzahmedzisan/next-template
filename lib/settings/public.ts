import "server-only";

import { formatMediaUrl } from "@/lib/media/media-url";
import { seoFetch } from "@/lib/seo/api";

export type PublicSettings = {
  name: string;
  short_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  registration_enabled: boolean;
};

const fallback: PublicSettings = {
  name: "Workspace",
  short_name: "Workspace",
  logo_url: null,
  favicon_url: null,
  registration_enabled: true,
};

export async function fetchPublicSettings(): Promise<PublicSettings> {
  try {
    // Saving general settings calls updateTag("seo"), which drops this entry.
    const response = await seoFetch("/settings/public", {
      next: { revalidate: 300, tags: ["seo"] },
    });
    const body = (await response.json()) as { data?: { settings?: PublicSettings } };
    const settings = body.data?.settings;
    if (!settings) return fallback;

    return {
      name: settings.name || fallback.name,
      short_name: settings.short_name || settings.name || fallback.short_name,
      logo_url: formatMediaUrl(settings.logo_url),
      favicon_url: formatMediaUrl(settings.favicon_url),
      registration_enabled: settings.registration_enabled !== false,
    };
  } catch {
    return fallback;
  }
}
