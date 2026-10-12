export type SeoAuditStatus = "queued" | "running" | "completed" | "failed";
export type SeoAuditScope = "full" | "sitemap" | "robots";
export type SeoAuditSection = "pages" | "site" | "sitemap" | "robots";
export type SeoCheckCategory = "meta" | "content" | "configuration" | "performance" | "site" | "robots" | "sitemap";
export type SeoCheckPriority = "high" | "medium" | "low";

export type SeoAuditRow = {
  id: number;
  status: SeoAuditStatus;
  trigger: "manual" | "schedule";
  scope: SeoAuditScope;
  site_url: string | null;
  environment: "development" | "production" | null;
  include_noindex: boolean;
  score: number | null;
  pages_total: number;
  pages_scanned: number;
  pages_failed: number;
  checks_passed: number;
  checks_failed: number;
  error: string | null;
  /** Null for sections a scoped run skipped. */
  sections?: { key: SeoAuditSection; score: number | null }[];
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type SeoAuditIssue = {
  key: string;
  label: string;
  category: SeoCheckCategory;
  section: SeoAuditSection;
  priority: SeoCheckPriority;
  weight: number;
  fix_minutes: number;
  message: string;
  /** Pages failing the check; 0 for site, sitemap and robots.txt checks. */
  pages: number;
};

export type SeoAuditSummary = {
  sections?: { key: SeoAuditSection; label: string; score: number | null; weight: number }[];
  categories: { key: SeoCheckCategory; label: string; score: number }[];
  types: { type: string; label: string; pages: number; score: number }[];
  issues: SeoAuditIssue[];
  informational: { key: string; label: string; passed: number; failed: number }[];
  not_scored: { key: string; label: string; category: "performance" | "environment"; passed: number; failed: number }[];
};

export type SeoAuditPageRow = {
  id: number;
  audit_id: number;
  kind: "page" | "model";
  page_type: string;
  label: string;
  url: string;
  seo_page_id: number | null;
  seoable_type: string | null;
  seoable_id: number | null;
  indexable: boolean;
  status_code: number | null;
  score: number | null;
  passed: number;
  failed: number;
  ttfb_ms: number | null;
  html_bytes: number | null;
  /** Keys of the checks this page failed; missing on an API that predates it. */
  failed_checks?: string[];
  error: string | null;
};

export type SeoAuditCheck = {
  key: string;
  label: string;
  category: SeoCheckCategory;
  weight: number;
  priority: SeoCheckPriority;
  fix_minutes: number;
  informational: boolean;
  environment: boolean;
  counted: boolean;
  passed: boolean;
  actual: string | null;
  expected: string | null;
  message: string;
};

export type SeoSiteDetails = { home_status: number | null; icons: string[] };

export type SeoRobotsDetails = {
  url: string;
  status: number | null;
  content_type: string | null;
  bytes: number | null;
  sitemaps: string[];
  groups: { agents: string[]; rules: number }[];
  problems: string[];
  ai: { blocked?: string[]; allowed?: string[] };
  content: string | null;
};

export type SeoSitemapDetails = {
  files: {
    url: string;
    status: number | null;
    content_type: string | null;
    bytes: number | null;
    gzip: boolean;
    root: string | null;
    count: number;
    error: string | null;
  }[];
  urls: number;
  sample: string[];
  missing: string[];
};

/** The newest report of a section, from a full audit or a sitemap/robots-only run. */
export type SeoSectionReport<Details> = {
  score: number | null;
  checks: SeoAuditCheck[];
  passed: number;
  failed: number;
  details: Details;
  audit_id: number;
  scope: SeoAuditScope;
  environment: "development" | "production" | null;
  finished_at: string | null;
};

export type SeoAuditLatest = {
  current: SeoAuditRow | null;
  completed: (SeoAuditRow & { summary: SeoAuditSummary | null; pages: SeoAuditPageRow[] }) | null;
  sections?: {
    site: SeoSectionReport<SeoSiteDetails> | null;
    sitemap: SeoSectionReport<SeoSitemapDetails> | null;
    robots: SeoSectionReport<SeoRobotsDetails> | null;
  };
  categories: Record<SeoCheckCategory, string>;
  limits?: { ttfb_ms: number; max_html_kb: number };
};
