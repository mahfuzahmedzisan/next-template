"use client";

import type { ReactNode } from "react";

import { ShellSidebarBridge } from "@/components/layout/shell-sidebar";
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
      <ShellSidebarBridge>{children}</ShellSidebarBridge>
    </SidebarProvider>
  );
}
