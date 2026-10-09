import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ApplicationSettingsScreen } from "@/components/admin/application/application-settings";
import { RouteReady } from "@/components/transitions/route-ready";
import { getSession } from "@/lib/auth/auth-cookies";
import { getApplicationSettings } from "@/lib/settings/admin";

export default async function ApplicationSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/admin");

  const settings = await getApplicationSettings();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <RouteReady />
      <Suspense>
        <ApplicationSettingsScreen initial={settings} />
      </Suspense>
    </div>
  );
}
