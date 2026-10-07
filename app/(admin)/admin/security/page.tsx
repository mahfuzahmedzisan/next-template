import { redirect } from "next/navigation";

import {
  AccountPageHeader,
  AccountSection,
} from "@/components/admin/account/account-chrome";
import { DangerZone } from "@/components/admin/profile/danger-zone";
import { PasswordForm } from "@/components/admin/profile/password-form";
import { TwoFactorSection } from "@/components/admin/profile/two-factor-section";
import { getSession } from "@/lib/auth/auth-cookies";
import { RouteReady } from "@/components/transitions/route-ready";

export default async function SecurityPage() {
  const session = await getSession();
  if (!session) redirect("/login");

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
        title="Danger zone"
        description="Permanently delete your account and revoke every session."
        danger
      >
        <DangerZone />
      </AccountSection>
    </div>
  );
}
