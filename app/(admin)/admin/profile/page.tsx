import { redirect } from "next/navigation";

import {
  AccountPageHeader,
  AccountSection,
} from "@/components/admin/account/account-chrome";
import { ProfileForm } from "@/components/admin/profile/profile-form";
import { getSession } from "@/lib/auth/auth-cookies";
import { RouteReady } from "@/components/transitions/route-ready";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <RouteReady />
      <AccountPageHeader
        active="profile"
        title="Profile"
        description="Update the photo, name, and email used across the workspace."
      />
      <AccountSection
        title="Personal details"
        description="These details appear in the sidebar and account menus."
      >
        <ProfileForm user={session.user} />
      </AccountSection>
    </div>
  );
}
