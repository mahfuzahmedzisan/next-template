import type { BackupKind, BackupStatus } from "@/lib/admin/backups";

export const KIND_LABELS: Record<BackupKind, string> = {
  scheduled: "Scheduled",
  manual: "Manual",
  pre_restore: "Before restore",
};

export function isRunning(status: BackupStatus | null) {
  return status?.state === "queued" || status?.state === "running";
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** "12:00 AM" for the configured run time, read in the schedule's own zone. */
export function formatScheduleTime(nextRunAt: string, timeZone: string) {
  return new Date(nextRunAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}
