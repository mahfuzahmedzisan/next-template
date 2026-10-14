"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useSidebar } from "@/components/ui/sidebar";

type ShellSidebar = {
  isMobile: boolean;
  setOpenMobile: (open: boolean) => void;
};

const ShellSidebarContext = createContext<ShellSidebar | null>(null);

/** Must render inside SidebarProvider. */
export function ShellSidebarBridge({ children }: { children: ReactNode }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const value = useMemo(() => ({ isMobile, setOpenMobile }), [isMobile, setOpenMobile]);

  return <ShellSidebarContext.Provider value={value}>{children}</ShellSidebarContext.Provider>;
}

/** Like useSidebar, but returns null outside the app shell instead of throwing. */
export function useSidebarOptional() {
  return useContext(ShellSidebarContext);
}
