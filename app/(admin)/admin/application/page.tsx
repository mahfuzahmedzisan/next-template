import { redirect } from "next/navigation";

import { ApplicationSettingsScreen } from "@/components/admin/application/application-settings";
import { getApplicationSettings } from "@/lib/settings/admin";

const moved = {
  smtp: "/admin/application/smtp",
  backup: "/admin/application/backup",
  audit: "/admin/application/audit",
} as const;

export default async function ApplicationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab && tab in moved) redirect(moved[tab as keyof typeof moved]);

  const settings = await getApplicationSettings();
  return <ApplicationSettingsScreen initial={settings} section="general" />;
}
