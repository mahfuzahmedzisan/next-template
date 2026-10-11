import { redirect } from "next/navigation";

import {
  AccountPageHeader,
  AccountSection,
} from "@/components/admin/account/account-chrome";
import { RecentActivity } from "@/components/admin/audit/recent-activity";
import { DangerZone } from "@/components/admin/profile/danger-zone";
import { PasswordForm } from "@/components/admin/profile/password-form";
import { TwoFactorSection } from "@/components/admin/profile/two-factor-section";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { Button } from "@/components/ui/button";
import { listMyActivity } from "@/lib/admin/audit";
import { getSession } from "@/lib/auth/auth-cookies";
import { RouteReady } from "@/components/transitions/route-ready";

export default async function SecurityPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const recent = await listMyActivity({ perPage: 5 });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <RouteReady />
      <AccountPageHeader
        active="security"
        title="Security"
        description="Protect the account with a strong password and two-factor authentication."
      />

      <AccountSection
        title="Password"
        description="Choose a new password. You will stay signed in on this device."
      >
        <PasswordForm />
      </AccountSection>

      <AccountSection
        title="Two-factor authentication"
        description="Add an authenticator app as a second step at sign-in."
      >
        <TwoFactorSection enabled={session.user.two_factor_enabled} />
      </AccountSection>

      <AccountSection
        title="Signed-in devices"
        description="See every device signed in to this account, revoke one, or sign out everywhere."
      >
        <Button variant="outline" asChild>
          <Link href="/admin/devices">Manage devices</Link>
        </Button>
      </AccountSection>

      <AccountSection
        title="Recent activity"
        description="The latest sign-ins and security changes on this account."
      >
        <RecentActivity entries={recent.activities} total={recent.meta.total} />
      </AccountSection>

      <AccountSection
        title="Danger zone"
        description="Permanently delete your account and revoke every session."
        danger
      >
        <DangerZone />
      </AccountSection>
    </div>
  );
}
