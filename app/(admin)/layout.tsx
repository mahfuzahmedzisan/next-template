import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/(admin)/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSession } from "@/lib/auth/auth-cookies";
import { logoutUrl } from "@/lib/auth/session-expired";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // Reaching here without a session means the cookie exists but can no
  // longer be refreshed - the proxy turns away visitors with no cookie at
  // all. Going by way of the logout route clears it; redirecting straight
  // to /login would leave the proxy seeing a live-looking session and
  // bouncing us right back.
  if (!session) {
    redirect(logoutUrl());
  }

  return (
    <AdminShell user={session.user} onLogout={logoutAction}>
      {children}
    </AdminShell>
  );
}
