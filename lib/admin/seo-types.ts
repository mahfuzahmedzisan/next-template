export type SeoAffixMode = "inherit" | "custom" | "none";
export type SeoImagePreview = "none" | "standard" | "large";
export type SeoFileName = "sitemap" | "robots" | "llms";

/** The editable SEO field set shared by static pages and detail records. */
export type SeoFieldValues = {
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  author: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  max_image_preview: SeoImagePreview;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_image_alt: string | null;
  og_type: string | null;
  og_locale: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  schema_type: string | null;
  in_sitemap: boolean;
  sitemap_priority: number | null;
  sitemap_changefreq: string | null;
  title_affix_mode: SeoAffixMode;
  title_prefix: string | null;
  title_suffix: string | null;
};

export type SeoIdentity = {
  name: string;
  short_name: string;
  site_url: string;
  logo_url: string | null;
  locale: string;
};

export type SeoGlobalSettings = {
  site_url: string;
  site_url_setting: string;
  site_url_fallback: string;
  /** Set in production when canonical links would still be local or the revalidate hook is missing. */
  site_url_warning?: string | null;
  title_prefix: string;
  title_suffix: string;
  default_description: string;
  default_keywords: string[];
  default_author: string;
  default_og_image: string | null;
  default_og_image_url: string | null;
  og_locale: string;
  twitter_site: string;
  twitter_creator: string;
  robots_disallow: string[];
  robots_extra: string;
  allow_ai_crawlers: boolean;
  llms_enabled: boolean;
  identity: SeoIdentity;
};

export type SeoCompleteness = {
  score: number;
  items: { key: string; label: string; ok: boolean }[];
};

export type SeoPageEntry = {
  id: number;
  path: string;
  label: string;
  page_type: string;
  is_system: boolean;
  fields: SeoFieldValues & { og_image_url: string | null; twitter_image_url: string | null };
  status: { code: number | null; redirect_to: string | null; checked_at: string | null };
  resolved: {
    title: string;
    raw_title: string;
    description: string | null;
    canonical: string;
    canonical_base: string;
    self_canonical: boolean;
    og_image: string;
    og_title: string;
    og_description: string | null;
    keywords: string[];
    author: string | null;
    robots: { index: boolean; follow: boolean; max_image_preview: SeoImagePreview };
    in_sitemap: boolean;
  };
  completeness: SeoCompleteness;
  updated_at: string | null;
};

export type SeoFileEntry = {
  file: SeoFileName;
  name: string;
  url: string;
  enabled: boolean;
  generated_at: string | null;
  size: number | null;
  urls: number | null;
  files: number | null;
};

export type SeoTypeTemplate = {
  title_template?: string | null;
  description?: string | null;
  og_type?: string | null;
  schema_type?: string | null;
  sitemap_priority?: number | null;
  sitemap_changefreq?: string | null;
};

export type SeoTypeEntry = { type: string; label: string; template: SeoTypeTemplate };

export type SeoOptions = {
  page_types: string[];
  schema_types: string[];
  og_types: string[];
  twitter_cards: string[];
  change_frequencies: string[];
  image_previews: SeoImagePreview[];
  affix_modes: SeoAffixMode[];
  placeholders: string[];
  /** The SEO health scan's strict ranges, so the editor counts against the same limits. */
  lengths: Record<"title" | "description", { min: number; max: number }>;
};

export type SeoOverview = {
  settings: SeoGlobalSettings;
  pages: SeoPageEntry[];
  files: SeoFileEntry[];
  types: SeoTypeEntry[];
  options: SeoOptions;
};

export type SeoSettingsInput = Partial<
  Omit<SeoGlobalSettings, "site_url" | "site_url_fallback" | "site_url_warning" | "default_og_image_url" | "identity" | "site_url_setting">
> & { site_url?: string | null };

export type SeoPageInput = Partial<SeoFieldValues> & {
  path?: string;
  label?: string;
  page_type?: string;
};

export const EMPTY_SEO_FIELDS: SeoFieldValues = {
  meta_title: null,
  meta_description: null,
  keywords: null,
  author: null,
  canonical_url: null,
  robots_index: true,
  robots_follow: true,
  max_image_preview: "large",
  og_title: null,
  og_description: null,
  og_image: null,
  og_image_alt: null,
  og_type: null,
  og_locale: null,
  twitter_card: null,
  twitter_title: null,
  twitter_description: null,
  twitter_image: null,
  schema_type: null,
  in_sitemap: true,
  sitemap_priority: null,
  sitemap_changefreq: null,
  title_affix_mode: "inherit",
  title_prefix: null,
  title_suffix: null,
};
