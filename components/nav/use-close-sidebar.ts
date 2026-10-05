"use client";

import { useSidebar } from "@/components/ui/sidebar";

/** Close the mobile drawer after a navigation. No-op on desktop. */
export function useCloseSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

  return () => {
    if (isMobile) setOpenMobile(false);
  };
}
