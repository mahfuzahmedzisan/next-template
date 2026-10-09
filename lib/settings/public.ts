import "server-only";

import { formatMediaUrl } from "@/lib/media/media-url";
import { laravelHttp, unwrapOrThrow } from "@/lib/auth/http";

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
    const response = await laravelHttp.get("/settings/public", { timeout: 8000 });
    const data = unwrapOrThrow<{ settings: PublicSettings }>(response);
    const settings = data.settings;

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
