import { BackupScreen } from "@/components/admin/application/backups/backup-screen";
import { listBackups } from "@/lib/admin/backups";
import { getStatsOrNull } from "@/lib/admin/stats";

export default async function BackupSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [overview, history, params] = await Promise.all([listBackups(), getStatsOrNull("backups"), searchParams]);
  const downloadError = typeof params.download_error === "string" ? params.download_error : null;

  return <BackupScreen overview={overview} history={history} downloadError={downloadError} />;
}
