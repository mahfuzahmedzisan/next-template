"use client";

import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden bg-muted/50">
      {children}
    </SidebarProvider>
  );
}
