export type SeoAuditStatus = "queued" | "running" | "completed" | "failed";
export type SeoCheckCategory = "meta" | "content" | "configuration" | "performance";
export type SeoCheckPriority = "high" | "medium" | "low";

export type SeoAuditRow = {
  id: number;
  status: SeoAuditStatus;
  trigger: "manual" | "schedule";
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
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type SeoAuditIssue = {
  key: string;
  label: string;
  category: SeoCheckCategory;
  priority: SeoCheckPriority;
  weight: number;
  fix_minutes: number;
  message: string;
  pages: number;
};

export type SeoAuditSummary = {
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

export type SeoAuditLatest = {
  current: SeoAuditRow | null;
  completed: (SeoAuditRow & { summary: SeoAuditSummary | null; pages: SeoAuditPageRow[] }) | null;
  categories: Record<SeoCheckCategory, string>;
};
