import type { ChartConfig } from "@/components/ui/chart";
import type { AuditCategoryKey, AuditSeverityKey, MediaKindKey, MediaStatusKey, PersonalCategoryKey } from "@/lib/admin/stats-types";

/** Theme tokens only; the softer shades mix a token with the background. */
const soft = (token: string) => `color-mix(in oklch, var(${token}) 55%, var(--background))`;

export const categoryConfig = {
  auth: { label: "Sign-in", color: "var(--chart-1)" },
  security: { label: "Security", color: "var(--chart-5)" },
  account: { label: "Account", color: "var(--chart-2)" },
  users: { label: "Users", color: "var(--chart-3)" },
  media: { label: "Media", color: "var(--chart-4)" },
  settings: { label: "Settings", color: soft("--chart-1") },
  backups: { label: "Backups", color: soft("--chart-2") },
  system: { label: "System", color: "var(--muted-foreground)" },
} satisfies Record<AuditCategoryKey, ChartConfig[string]>;

export const personalCategoryConfig = {
  auth: categoryConfig.auth,
  security: categoryConfig.security,
  account: categoryConfig.account,
  users: { label: "Profile changes", color: categoryConfig.users.color },
} satisfies Record<PersonalCategoryKey, ChartConfig[string]>;

export const severityConfig = {
  info: { label: "Info", color: "var(--chart-2)" },
  notice: { label: "Notice", color: "var(--chart-3)" },
  warning: { label: "Warning", color: "var(--score-warn)" },
  critical: { label: "Critical", color: "var(--score-bad)" },
} satisfies Record<AuditSeverityKey, ChartConfig[string]>;

export const signInConfig = {
  succeeded: { label: "Succeeded", color: "var(--score-good)" },
  failed: { label: "Failed", color: "var(--score-bad)" },
} satisfies ChartConfig;

export const backupRunsConfig = {
  completed: { label: "Completed", color: "var(--score-good)" },
  failed: { label: "Failed", color: "var(--score-bad)" },
} satisfies ChartConfig;

export const mediaKindConfig = {
  image: { label: "Images", color: "var(--chart-1)" },
  video: { label: "Videos", color: "var(--chart-2)" },
  audio: { label: "Audio", color: "var(--chart-3)" },
  pdf: { label: "PDFs", color: "var(--chart-4)" },
  document: { label: "Documents", color: "var(--chart-5)" },
} satisfies Record<MediaKindKey, ChartConfig[string]>;

export const mediaStatusLabels: Record<MediaStatusKey, string> = {
  awaiting_upload: "Awaiting upload",
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};
