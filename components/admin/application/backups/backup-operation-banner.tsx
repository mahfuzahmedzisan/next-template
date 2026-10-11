"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { formatDateTime } from "@/components/admin/devices/device-meta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { BackupStatus } from "@/lib/admin/backups";

/** Completed runs stop being news after a while; failures stay until the next run. */
const COMPLETED_VISIBLE_MS = 10 * 60 * 1000;

function title(status: BackupStatus) {
  const subject = status.operation === "restore" ? "Restore" : "Backup";

  switch (status.state) {
    case "queued":
      return `${subject} is waiting to start`;
    case "running":
      return status.operation === "restore" ? "Restoring the database" : "Creating a backup";
    case "completed":
      return status.operation === "restore" ? "Database restored" : "Backup created";
    case "failed":
      return `${subject} failed`;
  }
}

export function BackupOperationBanner({
  status,
  now,
  timeZone,
}: {
  status: BackupStatus | null;
  now: number;
  timeZone: string;
}) {
  if (!status) return null;

  if (
    status.state === "completed" &&
    status.finished_at &&
    now - new Date(status.finished_at).getTime() > COMPLETED_VISIBLE_MS
  ) {
    return null;
  }

  const running = status.state === "queued" || status.state === "running";
  const failed = status.state === "failed";
  const Icon = running ? Loader2 : failed ? XCircle : CheckCircle2;

  return (
    <Alert variant={failed ? "destructive" : "default"} aria-live="polite">
      <Icon className={running ? "animate-spin" : undefined} aria-hidden />
      <AlertTitle>{title(status)}</AlertTitle>
      <AlertDescription>
        <p>
          {status.message ?? "Working…"}
          {running ? " This page updates on its own." : null}
        </p>
        {failed && status.operation === "restore" && status.safety_backup ? (
          <p>
            The database before the restore was saved as{" "}
            <span className="font-mono text-foreground">{status.safety_backup}</span>. See
            docs/backups.md to restore it from the server if the admin is unreachable.
          </p>
        ) : null}
        {status.finished_at ? (
          <p className="text-xs">Finished {formatDateTime(status.finished_at, timeZone)}</p>
        ) : (
          <p className="text-xs">Started {formatDateTime(status.started_at, timeZone)}</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
