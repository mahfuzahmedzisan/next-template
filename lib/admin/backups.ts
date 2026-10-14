import "server-only";

import { authedRequest } from "@/lib/auth/api";

export type BackupKind = "scheduled" | "manual" | "pre_restore";

export type BackupEntry = {
  id: string;
  kind: BackupKind;
  size: number;
  created_at: string;
};

export type BackupSummary = {
  count: number;
  total_size: number;
  /** Cleanup prunes the oldest backups above this; null means unlimited. */
  max_storage_bytes: number | null;
  newest_at: string | null;
  retention_days: number;
  schedule: { time: string; timezone: string; next_run_at: string };
  encrypted: boolean;
  healthy: boolean;
  health_message: string | null;
  backup_supported: boolean;
  backup_unsupported_reason: string | null;
  restore_supported: boolean;
  restore_unsupported_reason: string | null;
};

export type BackupOperationState = "queued" | "running" | "completed" | "failed";

export type BackupStatus = {
  operation: "backup" | "restore";
  state: BackupOperationState;
  kind: BackupKind | null;
  backup: string | null;
  safety_backup: string | null;
  message: string | null;
  started_at: string;
  updated_at: string;
  finished_at: string | null;
};

export type BackupOverview = {
  backups: BackupEntry[];
  summary: BackupSummary;
  status: BackupStatus | null;
};

export function listBackups() {
  return authedRequest<BackupOverview>("get", "/admin/backups");
}

export function createBackup() {
  return authedRequest<BackupOverview>("post", "/admin/backups");
}

export function deleteBackup(id: string) {
  return authedRequest<BackupOverview>(
    "delete",
    `/admin/backups/${encodeURIComponent(id)}`,
  );
}

export function restoreBackup(
  id: string,
  input: { current_password: string; confirmation: string },
) {
  return authedRequest<BackupOverview>(
    "post",
    `/admin/backups/${encodeURIComponent(id)}/restore`,
    input,
  );
}

export function createBackupDownloadToken(
  id: string,
  input: { current_password: string },
) {
  return authedRequest<{ token: string; expires_at: string }>(
    "post",
    `/admin/backups/${encodeURIComponent(id)}/download-token`,
    input,
  );
}
