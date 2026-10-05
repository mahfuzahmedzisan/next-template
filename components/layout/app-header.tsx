"use client";

import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { BreadcrumbItem } from "@/lib/nav";

export function AppHeader({
  breadcrumbs,
  actions,
}: {
  breadcrumbs: BreadcrumbItem[];
  actions?: ReactNode;
}) {
  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/70 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <div className="min-w-0">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
      {actions ? (
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
