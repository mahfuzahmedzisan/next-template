import type { ReactNode } from "react";

import { SidebarInset } from "@/components/ui/sidebar";

export function AppContent({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <SidebarInset className="min-h-0 overflow-hidden bg-background/80 shadow-sm backdrop-blur-sm">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
    </SidebarInset>
  );
}
