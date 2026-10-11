"use client";

import { CalendarClock, HardDrive, History, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  formatScheduleTime,
  formatSize,
} from "@/components/admin/application/backups/backup-meta";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import { Badge } from "@/components/ui/badge";
import type { BackupSummary } from "@/lib/admin/backups";

function Stat({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <p className="text-sm font-semibold">{value}</p>
      <div className="text-xs leading-5 text-muted-foreground">{children}</div>
    </div>
  );
}

export function BackupOverview({
  summary,
  timeZone,
}: {
  summary: BackupSummary;
  timeZone: string;
}) {
  const scheduleTime = formatScheduleTime(summary.schedule.next_run_at, summary.schedule.timezone);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={History}
        label="Last backup"
        value={summary.newest_at ? formatDateTime(summary.newest_at, timeZone) : "None yet"}
      >
        {summary.count > 0 ? (
          <Badge variant={summary.healthy ? "secondary" : "destructive"}>
            {summary.healthy ? "Healthy" : "Needs attention"}
          </Badge>
        ) : (
          "Nothing has been backed up."
        )}
      </Stat>
      <Stat
        icon={CalendarClock}
        label="Next backup"
        value={formatDateTime(summary.schedule.next_run_at, timeZone)}
      >
        Every day at {scheduleTime} ({summary.schedule.timezone})
      </Stat>
      <Stat icon={ShieldCheck} label="Retention" value={`${summary.retention_days} days`}>
        Older backups are deleted automatically.
      </Stat>
      <Stat
        icon={HardDrive}
        label="Storage used"
        value={formatSize(summary.total_size)}
      >
        {summary.count} {summary.count === 1 ? "backup" : "backups"}
        {summary.encrypted ? " · Encrypted" : null}
      </Stat>
    </div>
  );
}
