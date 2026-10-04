import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/(admin)/actions";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <AdminSidebar user={session.user} onLogout={logoutAction} />
      <SidebarInset>
        <AdminHeader />
        <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
