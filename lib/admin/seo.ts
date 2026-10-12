import "server-only";

import type { SeoAuditCheck, SeoAuditLatest, SeoAuditPageRow, SeoAuditRow, SeoAuditScope } from "@/lib/admin/seo-audit-types";
import type {
  SeoFileEntry,
  SeoFileName,
  SeoOverview,
  SeoPageEntry,
  SeoPageInput,
  SeoSettingsInput,
  SeoTypeTemplate,
} from "@/lib/admin/seo-types";
import { authedRequest } from "@/lib/auth/api";
import { formatMediaUrl } from "@/lib/media/media-url";

function rewritePage(page: SeoPageEntry): SeoPageEntry {
  return {
    ...page,
    fields: {
      ...page.fields,
      og_image: formatMediaUrl(page.fields.og_image),
      twitter_image: formatMediaUrl(page.fields.twitter_image),
    },
  };
}

function rewrite(overview: SeoOverview): SeoOverview {
  return {
    ...overview,
    settings: {
      ...overview.settings,
      default_og_image: formatMediaUrl(overview.settings.default_og_image),
    },
    pages: overview.pages.map(rewritePage),
  };
}

export async function getSeoOverview() {
  return rewrite(await authedRequest<SeoOverview>("get", "/admin/seo"));
}

export async function saveSeoSettings(input: SeoSettingsInput) {
  return rewrite(await authedRequest<SeoOverview>("put", "/admin/seo/settings", input));
}

export async function createSeoPage(input: SeoPageInput) {
  const data = await authedRequest<{ page: SeoPageEntry }>("post", "/admin/seo/pages", input);
  return rewritePage(data.page);
}

export async function updateSeoPage(id: number, input: SeoPageInput) {
  const data = await authedRequest<{ page: SeoPageEntry }>("put", `/admin/seo/pages/${id}`, input);
  return rewritePage(data.page);
}

export async function deleteSeoPage(id: number) {
  return rewrite(await authedRequest<SeoOverview>("delete", `/admin/seo/pages/${id}`));
}

export async function probeSeoPage(id: number) {
  const data = await authedRequest<{ page: SeoPageEntry }>("post", `/admin/seo/pages/${id}/probe`);
  return rewritePage(data.page);
}

export async function saveSeoTypeDefaults(type: string, template: SeoTypeTemplate) {
  return rewrite(
    await authedRequest<SeoOverview>("put", `/admin/seo/types/${encodeURIComponent(type)}`, template),
  );
}

export async function regenerateSeoFiles(file: SeoFileName | "all") {
  const data = await authedRequest<{ files: SeoFileEntry[] }>("post", `/admin/seo/files/${file}/regenerate`);
  return data.files;
}

export function getSeoAuditLatest() {
  return authedRequest<SeoAuditLatest>("get", "/admin/seo/audits/latest");
}

export async function listSeoAudits() {
  const data = await authedRequest<{ audits: SeoAuditRow[] }>("get", "/admin/seo/audits");
  return data.audits;
}

export function startSeoAudit(includeNoindex: boolean, scope: SeoAuditScope = "full") {
  return authedRequest<SeoAuditLatest>("post", "/admin/seo/audits", { include_noindex: includeNoindex, scope });
}

export async function getSeoAuditPage(auditId: number, pageId: number) {
  const data = await authedRequest<{ page: SeoAuditPageRow & { checks: SeoAuditCheck[] } }>(
    "get",
    `/admin/seo/audits/${auditId}/pages/${pageId}`,
  );
  return data.page;
}
