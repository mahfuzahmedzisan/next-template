"use client";

import { AlertTriangle } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteBackupAction,
  downloadBackupAction,
  restoreBackupAction,
  type DownloadActionResult,
} from "@/app/(admin)/admin/application/backup/actions";
import { formatDateTime } from "@/components/admin/devices/device-meta";
import PasswordInput from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionResult } from "@/lib/actions/result";
import type { BackupEntry } from "@/lib/admin/backups";

type DialogProps = {
  backup: BackupEntry | null;
  timeZone: string;
  onClose: () => void;
};

function backupName(backup: BackupEntry | null, timeZone: string) {
  return backup ? `the backup from ${formatDateTime(backup.created_at, timeZone)}` : "this backup";
}

export function RestoreBackupDialog({ backup, timeZone, onClose }: DialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await restoreBackupAction(prev, formData);
      if (result.ok) {
        setConfirmation("");
        onClose();
      }
      return result;
    },
    null,
  );

  useActionToast(state);

  return (
    <Dialog
      open={backup !== null}
      onOpenChange={(open) => {
        if (open || pending) return;
        setConfirmation("");
        onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore this backup?</DialogTitle>
          <DialogDescription>
            The whole database is replaced with {backupName(backup, timeZone)}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            <li>Everything written after this backup is lost: users, settings, media records.</li>
            <li>A safety backup of the current database is taken first.</li>
            <li>
              You will most likely be signed out. Sign in with the password that was valid when
              the backup was taken.
            </li>
          </ul>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="backup" value={backup?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="restore_current_password">Password</Label>
            <PasswordInput
              id="restore_current_password"
              name="current_password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restore_confirmation">
              Type <span className="font-mono font-semibold">RESTORE</span> to confirm
            </Label>
            <Input
              id="restore_confirmation"
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || confirmation !== "RESTORE"}
            >
              {pending ? "Starting restore…" : "Restore database"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DownloadBackupDialog({ backup, timeZone, onClose }: DialogProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: DownloadActionResult | null, formData: FormData) => {
      const result = await downloadBackupAction(prev, formData);
      if (result.ok) {
        onClose();
        window.location.assign(result.url);
      }
      return result;
    },
    null,
  );

  useActionToast(state);

  return (
    <Dialog open={backup !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download this backup?</DialogTitle>
          <DialogDescription>
            {backup ? `${backup.id} holds` : "The archive holds"} a full copy of the database,
            including password hashes. Keep the file somewhere safe.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="backup" value={backup?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="download_current_password">Password</Label>
            <PasswordInput
              id="download_current_password"
              name="current_password"
              autoComplete="current-password"
              required
            />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Created {formatDateTime(backup?.created_at ?? null, timeZone)}.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Preparing…" : "Download"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBackupDialog({ backup, timeZone, onClose }: DialogProps) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!backup) return;
    startTransition(async () => {
      const result = await deleteBackupAction(backup.id);
      if (result.ok) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message, { duration: 4000 });
      }
    });
  }

  return (
    <Dialog open={backup !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this backup?</DialogTitle>
          <DialogDescription>
            The backup from {formatDateTime(backup?.created_at ?? null, timeZone)} is removed
            from the server. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={remove} disabled={pending}>
            {pending ? "Deleting…" : "Delete backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
