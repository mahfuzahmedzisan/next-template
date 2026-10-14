"use client";

import { Clock, DatabaseBackup, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { backupNowAction } from "@/app/(admin)/admin/application/backup/actions";
import { ApplicationSectionHeader } from "@/components/admin/application/application-settings";
import { BackupCharts } from "@/components/admin/application/backups/backup-charts";
import { BackupList } from "@/components/admin/application/backups/backup-list";
import { isRunning } from "@/components/admin/application/backups/backup-meta";
import { BackupOperationBanner } from "@/components/admin/application/backups/backup-operation-banner";
import { BackupOverview } from "@/components/admin/application/backups/backup-overview";
import { useRangeData } from "@/components/admin/charts/use-range-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { BackupOverview as Overview } from "@/lib/admin/backups";
import type { BackupHistory } from "@/lib/admin/stats-types";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";

const POLL_MS = 4000;

export function BackupScreen({
  overview,
  history: initialHistory,
  downloadError,
}: {
  overview: Overview;
  history: BackupHistory | null;
  downloadError: string | null;
}) {
  const { backups, summary, status } = overview;
  const router = useRouter();
  const timeZone = useDisplayTimeZone();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const busy = isRunning(status);
  const previousState = useRef(status?.state);
  const history = useRangeData("backups", initialHistory);
  const { reload: reloadHistory } = history;

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => {
      router.refresh();
      setNow(Date.now());
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [busy, router]);

  useEffect(() => {
    const before = previousState.current;
    previousState.current = status?.state;
    if (before !== "queued" && before !== "running") return;

    const subject = status?.operation === "restore" ? "Restore" : "Backup";
    if (status?.state === "completed") toast.success(`${subject} finished.`);
    if (status?.state === "failed") toast.error(`${subject} failed.`, { duration: 5000 });
    if (status?.state === "completed" || status?.state === "failed") reloadHistory();
  }, [status?.state, status?.operation, reloadHistory]);

  useEffect(() => {
    if (!downloadError) return;
    toast.error(downloadError, { duration: 5000 });
    router.replace("/admin/application/backup", { scroll: false });
  }, [downloadError, router]);

  function backupNow() {
    startTransition(async () => {
      const result = await backupNowAction();
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message, { duration: 5000 });
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ApplicationSectionHeader section="backup">
        <Button onClick={backupNow} disabled={pending || busy || !summary.backup_supported}>
          <DatabaseBackup aria-hidden />
          {pending ? "Starting…" : busy ? "Working…" : "Backup now"}
        </Button>
      </ApplicationSectionHeader>

      {!summary.backup_supported && summary.backup_unsupported_reason ? (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Backups are unavailable on this server</AlertTitle>
          <AlertDescription>{summary.backup_unsupported_reason}</AlertDescription>
        </Alert>
      ) : null}

      <BackupOperationBanner status={status} now={now} timeZone={timeZone} />

      <BackupOverview summary={summary} timeZone={timeZone} />

      {summary.count > 0 && !summary.healthy && summary.health_message ? (
        <Alert variant="destructive">
          <Info aria-hidden />
          <AlertTitle>Backups need attention</AlertTitle>
          <AlertDescription>{summary.health_message}</AlertDescription>
        </Alert>
      ) : null}

      <BackupCharts
        backups={backups}
        summary={summary}
        timeZone={timeZone}
        history={history.data}
        days={history.days}
        pending={history.pending}
        error={history.error}
        onRange={history.selectRange}
      />

      <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-6">
        <div>
          <h3 className="font-heading text-lg font-semibold">Backups</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest first. Restore replaces the whole database; download needs your password.
          </p>
        </div>

        <BackupList
          backups={backups}
          timeZone={timeZone}
          busy={busy}
          restoreSupported={summary.restore_supported}
        />

        {summary.backup_supported && !summary.restore_supported && summary.restore_unsupported_reason ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Restore is off: {summary.restore_unsupported_reason}
          </p>
        ) : null}

        <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>
            Backups older than{" "}
            <span className="font-medium text-foreground">{summary.retention_days} days</span> are
            deleted every night. The newest backup is always kept. Only the database is backed
            up; media files are not included.
          </p>
        </div>
      </section>
    </div>
  );
}
