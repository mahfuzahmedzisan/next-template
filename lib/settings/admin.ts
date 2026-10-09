import "server-only";

import { authedRequest } from "@/lib/auth/api";
import { formatMediaUrl } from "@/lib/media/media-url";
import type { PublicSettings } from "@/lib/settings/public";

export type SmtpEncryption = "tls" | "ssl" | "none";

export type SmtpSettings = {
  enabled: boolean;
  host: string;
  port: number;
  encryption: SmtpEncryption;
  username: string;
  password_set: boolean;
  from_address: string;
  from_name: string;
};

export type AdminSettings = {
  general: PublicSettings;
  smtp: SmtpSettings;
};

function rewrite(settings: AdminSettings): AdminSettings {
  return {
    ...settings,
    general: {
      ...settings.general,
      logo_url: formatMediaUrl(settings.general.logo_url),
      favicon_url: formatMediaUrl(settings.general.favicon_url),
    },
  };
}

export async function getApplicationSettings() {
  const data = await authedRequest<{ settings: AdminSettings }>("get", "/admin/settings");
  return rewrite(data.settings);
}

export async function saveGeneralSettings(input: {
  name: string;
  short_name: string;
  registration_enabled: boolean;
  logo_url?: string | null;
  favicon_url?: string | null;
}) {
  const data = await authedRequest<{ settings: AdminSettings }>(
    "put",
    "/admin/settings/general",
    input,
  );
  return rewrite(data.settings);
}

export async function saveSmtpSettings(input: {
  enabled: boolean;
  host: string;
  port: number;
  encryption: SmtpEncryption;
  username: string;
  password: string;
  from_address: string;
  from_name: string;
}) {
  const data = await authedRequest<{ settings: AdminSettings }>(
    "put",
    "/admin/settings/smtp",
    input,
  );
  return rewrite(data.settings);
}

export async function uploadBrandFile(kind: "logo" | "favicon", file: File) {
  const body = new FormData();
  body.append("file", file);
  const data = await authedRequest<{ settings: AdminSettings }>(
    "post",
    `/admin/settings/${kind}`,
    body,
  );
  return rewrite(data.settings);
}
