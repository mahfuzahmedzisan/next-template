"use client";

import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({
  children,
  defaultOpen = true,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="h-svh min-h-0 overflow-hidden bg-muted/50"
    >
      {children}
    </SidebarProvider>
  );
}
