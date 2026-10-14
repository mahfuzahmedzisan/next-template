import { redirect } from "next/navigation";

import {
  AccountPageHeader,
  AccountSection,
} from "@/components/admin/account/account-chrome";
import { MyActivity } from "@/components/admin/audit/my-activity";
import { RouteReady } from "@/components/transitions/route-ready";
import { listMyActivity } from "@/lib/admin/audit";
import { getStatsOrNull } from "@/lib/admin/stats";
import { getSession } from "@/lib/auth/auth-cookies";

const CATEGORIES = new Set(["auth", "security", "account", "users"]);

export default async function MyActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const rawCategory = typeof params.category === "string" ? params.category : "";
  const category = CATEGORIES.has(rawCategory) ? rawCategory : "";

  const [result, stats] = await Promise.all([
    listMyActivity({ page, perPage: 20, category: category || undefined }),
    getStatsOrNull("profile"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <RouteReady />
      <AccountPageHeader
        active="activity"
        title="Activity"
        description="Your sign-ins, security changes and account edits, newest first."
      />

      <AccountSection
        title="Account activity"
        description="If something here wasn't you, change your password and sign out of other devices."
      >
        <MyActivity
          result={result}
          stats={stats}
          category={category}
          retentionNote="Entries are kept for the retention period set by the site administrator, then deleted automatically."
        />
      </AccountSection>
    </div>
  );
}
