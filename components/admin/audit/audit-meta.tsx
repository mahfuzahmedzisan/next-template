import {
  Activity,
  DatabaseBackup,
  Images,
  KeyRound,
  LogIn,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";

import type { AuditEntry, AuditOrigin, AuditSeverity } from "@/lib/admin/audit-types";
import { cn } from "cn";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  auth: LogIn,
  security: ShieldCheck,
  account: UserRound,
  users: UsersRound,
  media: Images,
  settings: Settings2,
  backups: DatabaseBackup,
  system: KeyRound,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Activity;
}

export const SEVERITY_LABELS: Record<AuditSeverity, string> = {
  info: "Info",
  notice: "Notice",
  warning: "Warning",
  critical: "Critical",
};

const SEVERITY_TONES: Record<AuditSeverity, string> = {
  info: "border-border/70 bg-muted/40 text-muted-foreground",
  notice: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critical: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function SeverityBadge({ severity, className }: { severity: AuditSeverity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium",
        SEVERITY_TONES[severity],
        className,
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function CategoryIcon({ entry, className }: { entry: Pick<AuditEntry, "category" | "severity">; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl border",
        SEVERITY_TONES[entry.severity],
        className,
      )}
    >
      {createElement(categoryIcon(entry.category), { className: "size-4", "aria-hidden": true })}
    </span>
  );
}

export const ORIGIN_LABELS: Record<AuditOrigin, string> = {
  web: "Web",
  queue: "Background job",
  console: "Command line",
  system: "System",
};

export function actorLabel(entry: AuditEntry) {
  if (entry.causer?.label) return entry.causer.label;
  if (entry.origin === "system") return "System";
  if (entry.origin === "console") return "Command line";
  if (entry.origin === "queue") return "Background job";
  return "Guest";
}

export function subjectLabel(entry: AuditEntry) {
  const subject = entry.subject;
  if (!subject) return null;
  if (subject.label) return subject.label;
  if (subject.type && subject.id) return `${subject.type} #${subject.id}`;
  return null;
}

export function deviceSummary(entry: Pick<AuditEntry, "device">) {
  const device = entry.device;
  if (!device || (!device.browser && !device.platform)) return null;
  if (!device.platform) return device.browser;
  if (!device.browser) return device.platform;
  return `${device.browser} on ${device.platform}`;
}

export function formatAuditTime(value: string, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
  });
}

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function formatRelative(value: string, now: number) {
  const diff = (new Date(value).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return "just now";
  if (abs < 3600) return RELATIVE.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return RELATIVE.format(Math.round(diff / 3600), "hour");
  if (abs < 604_800) return RELATIVE.format(Math.round(diff / 86_400), "day");
  return null;
}

/** Readable text for one stored value in a diff or the properties list. */
export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.every((item) => typeof item !== "object" || item === null)
      ? value.map((item) => formatAuditValue(item)).join(", ") || "—"
      : JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value, null, 2);
}

export function humanizeKey(key: string) {
  const spaced = key.replace(/[_.-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** UTC instant of 00:00 (or 23:59:59.999) on a calendar day in `timeZone`. */
export function zonedDayBoundary(day: string, timeZone: string, end = false) {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return null;

  const guess = Date.UTC(year, month - 1, date, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asZoned = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offset = asZoned - Math.floor(guess / 1000) * 1000;

  return new Date(guess - offset).toISOString();
}

/** Calendar day (YYYY-MM-DD) of an instant in `timeZone`, for date inputs. */
export function zonedDay(value: string | null, timeZone: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
