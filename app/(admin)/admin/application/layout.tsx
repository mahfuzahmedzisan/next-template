import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { RouteReady } from "@/components/transitions/route-ready";
import { getSession } from "@/lib/auth/auth-cookies";

export default async function ApplicationSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/admin");

  return (
    <div className="flex w-full flex-col gap-6">
      <RouteReady />
      {children}
    </div>
  );
}
