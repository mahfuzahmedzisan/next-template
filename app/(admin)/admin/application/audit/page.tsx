import { ApplicationSettingsScreen } from "@/components/admin/application/application-settings";
import { getApplicationSettings } from "@/lib/settings/admin";

export default async function AuditSettingsPage() {
  const settings = await getApplicationSettings();
  return <ApplicationSettingsScreen initial={settings} section="audit" />;
}
