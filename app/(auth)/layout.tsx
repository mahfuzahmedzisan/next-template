import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/auth-cookies";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
