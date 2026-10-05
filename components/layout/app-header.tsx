"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BreadcrumbItem } from "@/lib/nav";

function useModifierLabel() {
  return useSyncExternalStore(
    () => () => {},
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}

export function AppHeader({
  breadcrumbs,
  actions,
}: {
  breadcrumbs: BreadcrumbItem[];
  actions?: ReactNode;
}) {
  const modifier = useModifierLabel();

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/70 px-3 backdrop-blur-md md:px-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          Toggle sidebar
          <kbd className="rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground">
            {modifier} B
          </kbd>
        </TooltipContent>
      </Tooltip>
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
