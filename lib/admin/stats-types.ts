export const STAT_RANGES = [7, 30, 90] as const;

export type StatRange = (typeof STAT_RANGES)[number];

export const DEFAULT_STAT_RANGE: StatRange = 30;

/** Every stats response echoes the window it covers, in the viewer's timezone. */
export type StatWindow = {
  days: StatRange;
  timezone: string;
  /** Local `YYYY-MM-DD`, inclusive. */
  from: string;
  to: string;
};

/** One zero-filled day; the other keys are series counts. */
export type DailyPoint<K extends string> = { date: string } & Record<K, number>;

export type AuditSeverityKey = "info" | "notice" | "warning" | "critical";

export type AuditCategoryKey =
  | "auth"
  | "security"
  | "account"
  | "users"
  | "media"
  | "settings"
  | "backups"
  | "system";

export type PersonalCategoryKey = "auth" | "security" | "account" | "users";

/** Audit entries older than this are deleted nightly, so longer ranges would read as empty. */
type Retention = { retention_days: number };

export type AuditTrend = StatWindow & Retention & {
  daily: DailyPoint<AuditSeverityKey>[];
  daily_categories: DailyPoint<AuditCategoryKey>[];
  by_category: { value: AuditCategoryKey; label: string; count: number }[];
  sign_ins: DailyPoint<"succeeded" | "failed">[];
};

export type MediaKindKey = "image" | "video" | "audio" | "pdf" | "document";

export type MediaStatusKey = "awaiting_upload" | "uploaded" | "processing" | "ready" | "failed";

export type MediaStats = StatWindow & {
  totals: { count: number; bytes: number };
  by_kind: { value: MediaKindKey; count: number; bytes: number }[];
  by_status: { value: MediaStatusKey; count: number }[];
  uploads: DailyPoint<MediaKindKey>[];
};

export type BackupHistory = StatWindow & Retention & {
  daily: DailyPoint<"completed" | "failed">[];
};

export type ProfileActivityStats = StatWindow & Retention & {
  daily: DailyPoint<PersonalCategoryKey>[];
  severity_totals: Record<AuditSeverityKey, number>;
};

export type StatsKind = "audit" | "media" | "backups" | "profile";

export type StatsByKind = {
  audit: AuditTrend;
  media: MediaStats;
  backups: BackupHistory;
  profile: ProfileActivityStats;
};

export type StatsActionResult<T> = { ok: true; data: T } | { ok: false; message: string };
