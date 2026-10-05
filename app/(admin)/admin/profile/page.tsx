import { getSession } from "@/lib/auth/auth-cookies";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/admin/profile/profile-form";
import { PasswordForm } from "@/components/admin/profile/password-form";
import { TwoFactorSection } from "@/components/admin/profile/two-factor-section";
import { DangerZone } from "@/components/admin/profile/danger-zone";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          Profile &amp; security
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Name, password, and two-factor authentication for this account.
        </p>
      </div>

      <section
        id="profile"
        className="scroll-mt-6 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-md"
      >
        <h3 className="font-heading text-lg font-semibold">Profile</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your name and email address.
        </p>
        <div className="mt-5">
          <ProfileForm user={session.user} />
        </div>
      </section>

      <div id="security" className="scroll-mt-6 flex flex-col gap-6">
        <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-md">
          <h3 className="font-heading text-lg font-semibold">Password</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your password. You will stay signed in.
          </p>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-md">
          <h3 className="font-heading text-lg font-semibold">
            Two-factor authentication
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an authenticator app as a second step at sign-in.
          </p>
          <div className="mt-5">
            <TwoFactorSection enabled={session.user.two_factor_enabled} />
          </div>
        </section>
      </div>

      <section
        id="settings"
        className="scroll-mt-6 rounded-2xl border border-destructive/30 bg-card/80 p-5 shadow-sm backdrop-blur-md"
      >
        <h3 className="font-heading text-lg font-semibold text-destructive">
          Settings
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all data.
        </p>
        <div className="mt-5">
          <DangerZone />
        </div>
      </section>
    </div>
  );
}
