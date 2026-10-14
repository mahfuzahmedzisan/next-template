"use client";

import { useSidebarOptional } from "@/components/layout/shell-sidebar";

/** Close the mobile drawer after a navigation. No-op on desktop or outside the shell. */
export function useCloseSidebar() {
  const sidebar = useSidebarOptional();

  return () => {
    if (sidebar?.isMobile) sidebar.setOpenMobile(false);
  };
}
