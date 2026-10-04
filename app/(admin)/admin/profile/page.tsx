import { getSession } from "@/lib/auth/auth-cookies";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/admin/profile/profile-form";
import { PasswordForm } from "@/components/admin/profile/password-form";
import { TwoFactorSection } from "@/components/admin/profile/two-factor-section";
import { DangerZone } from "@/components/admin/profile/danger-zone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Profile &amp; security
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details, password, and two-factor authentication.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile information</CardTitle>
          <CardDescription>Update your name and email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={session.user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Update your password. You will stay signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an
            authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSection enabled={session.user.two_factor_enabled} />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  );
}
