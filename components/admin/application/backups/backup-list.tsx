"use client";

import {
  Archive,
  DatabaseBackup,
  Download,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import {
  DeleteBackupDialog,
  DownloadBackupDialog,
  RestoreBackupDialog,
} from "@/components/admin/application/backups/backup-dialogs";
import { formatSize, KIND_LABELS } from "@/components/admin/application/backups/backup-meta";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BackupEntry } from "@/lib/admin/backups";

type Target = { backup: BackupEntry; action: "restore" | "download" | "delete" };

export function BackupList({
  backups,
  timeZone,
  busy,
  restoreSupported,
}: {
  backups: BackupEntry[];
  timeZone: string;
  busy: boolean;
  restoreSupported: boolean;
}) {
  const [target, setTarget] = useState<Target | null>(null);
  const close = () => setTarget(null);
  const pick = (action: Target["action"]) => (target?.action === action ? target.backup : null);

  if (backups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
          <DatabaseBackup className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">No backups yet</p>
          <p className="mx-auto max-w-sm text-xs leading-5 text-muted-foreground">
            The first one is taken tonight. Use Backup now to create one right away.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
        {backups.map((backup, index) => (
          <li key={backup.id} className="flex items-center gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
              <Archive className="size-4 text-muted-foreground" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{formatDateTime(backup.created_at, timeZone)}</p>
                <Badge variant={backup.kind === "scheduled" ? "secondary" : "outline"}>
                  {KIND_LABELS[backup.kind]}
                </Badge>
                {index === 0 ? <Badge>Latest</Badge> : null}
              </div>
              <p className="truncate text-xs leading-5 text-muted-foreground">
                {formatSize(backup.size)} · {backup.id}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions for ${backup.id}`}>
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setTarget({ backup, action: "download" })}>
                  <Download aria-hidden />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={busy || !restoreSupported}
                  onSelect={() => setTarget({ backup, action: "restore" })}
                >
                  <RotateCcw aria-hidden />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={busy}
                  onSelect={() => setTarget({ backup, action: "delete" })}
                >
                  <Trash2 aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>

      <RestoreBackupDialog backup={pick("restore")} timeZone={timeZone} onClose={close} />
      <DownloadBackupDialog backup={pick("download")} timeZone={timeZone} onClose={close} />
      <DeleteBackupDialog backup={pick("delete")} timeZone={timeZone} onClose={close} />
    </>
  );
}
