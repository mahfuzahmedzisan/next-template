export type AuditSeverity = "info" | "notice" | "warning" | "critical";

export type AuditOrigin = "web" | "queue" | "console" | "system";

export type AuditParty = {
  type: string | null;
  id: number | null;
  label: string | null;
};

export type AuditDevice = {
  browser: string | null;
  platform: string | null;
  device_type: string;
};

export type AuditEntry = {
  id: number;
  category: string;
  category_label: string;
  event: string | null;
  title: string;
  description: string;
  severity: AuditSeverity;
  causer: AuditParty | null;
  subject: AuditParty | null;
  ip_address: string | null;
  device: AuditDevice | null;
  origin: AuditOrigin | null;
  request_id: string | null;
  changed_fields: string[];
  created_at: string;
};

export type AuditChange = {
  field: string;
  label: string;
  old: unknown;
  new: unknown;
};

export type AuditDetail = AuditEntry & {
  user_agent: string | null;
  changes: AuditChange[];
  properties: Record<string, unknown>;
  related_count: number;
};

export type AuditListMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type AuditListResult = {
  activities: AuditEntry[];
  meta: AuditListMeta;
};

export type AuditOption = { value: string; label: string };

export type AuditOverview = {
  stats: {
    total: number;
    last_24_hours: number;
    last_7_days: number;
    elevated_7_days: number;
    failed_sign_ins_24_hours: number;
    oldest_at: string | null;
  };
  retention_days: number;
  options: {
    categories: AuditOption[];
    severities: AuditOption[];
    events: (AuditOption & { category: string | null })[];
    subjects: string[];
  };
};
