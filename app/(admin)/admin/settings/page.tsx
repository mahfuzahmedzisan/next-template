import { redirect } from "next/navigation";

import {
  AccountPageHeader,
  AccountSection,
} from "@/components/admin/account/account-chrome";
import { PreferencesForm } from "@/components/admin/settings/preferences-form";
import { getSession } from "@/lib/auth/auth-cookies";
import { RouteReady } from "@/components/transitions/route-ready";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <RouteReady />
      <AccountPageHeader
        active="settings"
        title="Settings"
        description="Theme and notification preferences for your account."
      />
      <AccountSection
        title="Preferences"
        description="Changes sync across sessions once you are signed in."
      >
        <PreferencesForm user={session.user} />
      </AccountSection>
    </div>
  );
}
