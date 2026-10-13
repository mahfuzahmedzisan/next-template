import type { SeoFieldValues, SeoGlobalSettings, SeoPageEntry } from "@/lib/admin/seo-types";

export const SEO_TABS = ["pages", "defaults", "types", "files"] as const;
export type SeoTab = (typeof SEO_TABS)[number];

export function parseSeoTab(value: unknown): SeoTab {
  return SEO_TABS.find((tab) => tab === value) ?? "pages";
}

export const PAGE_TYPE_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
  listing: "Listing",
  contact: "Contact",
  landing: "Landing",
  legal: "Legal",
  auth: "Auth",
  other: "Other",
};

function squish(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function render(value: string, vars: Record<string, string>) {
  return squish(Object.entries(vars).reduce((text, [key, replacement]) => text.replaceAll(key, replacement), value));
}

/** Mirrors the backend title rule so the editor can preview before saving. */
export function previewTitle(
  fields: Pick<SeoFieldValues, "meta_title" | "title_affix_mode" | "title_prefix" | "title_suffix">,
  settings: Pick<SeoGlobalSettings, "title_prefix" | "title_suffix" | "identity">,
  fallbackTitle: string,
) {
  const siteName = settings.identity.name;
  const vars: Record<string, string> = {
    "{{site_name}}": siteName,
    "{{site_short_name}}": settings.identity.short_name,
    "{{year}}": String(new Date().getFullYear()),
  };
  const raw = render(fields.meta_title?.trim() || fallbackTitle || siteName, vars);
  if (fields.title_affix_mode === "none") return raw;

  vars["{{page_title}}"] = raw;
  let prefix = render(fields.title_affix_mode === "custom" ? fields.title_prefix ?? "" : settings.title_prefix, vars);
  let suffix = render(fields.title_affix_mode === "custom" ? fields.title_suffix ?? "" : settings.title_suffix, vars);

  if (raw === siteName) {
    if (prefix.includes(siteName)) prefix = "";
    if (suffix.includes(siteName)) suffix = "";
  }

  return squish(`${prefix} ${raw} ${suffix}`);
}

export type LengthState = "empty" | "short" | "good" | "long";

export function lengthState(length: number, range: { min: number; max: number }): LengthState {
  if (length === 0) return "empty";
  if (length < range.min) return "short";
  if (length > range.max) return "long";
  return "good";
}

export type StatusTone = "ok" | "warn" | "bad" | "idle";

export function statusInfo(status: SeoPageEntry["status"]): { label: string; tone: StatusTone; hint: string } {
  const code = status.code;
  if (code === null) return { label: "Not checked", tone: "idle", hint: "The path has not been checked yet." };
  if (code === 0) return { label: "Unreachable", tone: "bad", hint: "The site did not answer. It stays in the sitemap until a check succeeds." };
  if (code >= 200 && code < 300) return { label: `${code} OK`, tone: "ok", hint: "The page is live." };
  if (code >= 300 && code < 400) {
    return {
      label: `${code} Redirect`,
      tone: "warn",
      hint: status.redirect_to ? `Redirects to ${status.redirect_to}. Left out of the sitemap.` : "Redirects. Left out of the sitemap.",
    };
  }
  if (code === 404 || code === 410) return { label: `${code} Not found`, tone: "bad", hint: "The page does not exist. Left out of the sitemap." };
  return { label: `${code}`, tone: "warn", hint: "Unexpected response from the site." };
}

/** A broken or redirecting status, or meta that is less than 80% complete. */
export function needsAttention(page: SeoPageEntry) {
  const tone = statusInfo(page.status).tone;
  return tone === "warn" || tone === "bad" || page.completeness.score < 80;
}

export function keywordsToText(keywords: string[] | null | undefined) {
  return (keywords ?? []).join(", ");
}

export function textToKeywords(value: string): string[] | null {
  const seen = new Set<string>();
  const list = value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => {
      const key = keyword.toLowerCase();
      if (!keyword || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return list.length > 0 ? list : null;
}

export function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
