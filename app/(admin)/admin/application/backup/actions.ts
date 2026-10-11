"use server";

import { revalidatePath } from "next/cache";

import { toResult, type ActionResult } from "@/lib/actions/result";
import {
  createBackup,
  createBackupDownloadToken,
  deleteBackup,
  restoreBackup,
} from "@/lib/admin/backups";

const BACKUP_PATH = "/admin/application/backup";

export type DownloadActionResult =
  | { ok: true; message: string; url: string }
  | { ok: false; message: string };

export async function backupNowAction(): Promise<ActionResult> {
  try {
    await createBackup();
    revalidatePath(BACKUP_PATH);
    return { ok: true, message: "Backup started. It appears in the list when it finishes." };
  } catch (error) {
    return toResult(error, "Unable to start a backup.");
  }
}

export async function deleteBackupAction(id: string): Promise<ActionResult> {
  try {
    await deleteBackup(id);
    revalidatePath(BACKUP_PATH);
    return { ok: true, message: "Backup deleted." };
  } catch (error) {
    return toResult(error, "Unable to delete this backup.");
  }
}

export async function restoreBackupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await restoreBackup(String(formData.get("backup") ?? ""), {
      current_password: String(formData.get("current_password") ?? ""),
      confirmation: String(formData.get("confirmation") ?? ""),
    });
    revalidatePath(BACKUP_PATH);
    return { ok: true, message: "Restore started." };
  } catch (error) {
    return toResult(error, "Unable to start the restore.");
  }
}

export async function downloadBackupAction(
  _prev: DownloadActionResult | null,
  formData: FormData,
): Promise<DownloadActionResult> {
  try {
    const { token } = await createBackupDownloadToken(String(formData.get("backup") ?? ""), {
      current_password: String(formData.get("current_password") ?? ""),
    });
    return {
      ok: true,
      message: "Download starting.",
      url: `/api/admin/backups/download?token=${encodeURIComponent(token)}`,
    };
  } catch (error) {
    return { ok: false, message: toResult(error, "Unable to prepare the download.").message };
  }
}
