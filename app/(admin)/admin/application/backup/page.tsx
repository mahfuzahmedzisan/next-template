import { BackupScreen } from "@/components/admin/application/backups/backup-screen";
import { listBackups } from "@/lib/admin/backups";

export default async function BackupSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [overview, params] = await Promise.all([listBackups(), searchParams]);
  const downloadError = typeof params.download_error === "string" ? params.download_error : null;

  return <BackupScreen overview={overview} downloadError={downloadError} />;
}
