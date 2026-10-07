"use client";

import type { LucideIcon } from "lucide-react";
import { TransitionLink as Link } from "@/components/transitions/transition-link";

import { Button } from "@/components/ui/button";
import { useCloseSidebar } from "@/components/nav/use-close-sidebar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarPromo({
  title,
  description,
  href,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
}) {
  const closeSidebar = useCloseSidebar();

  return (
    <>
      <div className="px-1 group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/70 p-3 shadow-sm backdrop-blur-md">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/70">
            {description}
          </p>
          <Button asChild size="sm" className="mt-3 w-full">
            <Link href={href} onClick={closeSidebar}>{action}</Link>
          </Button>
        </div>
      </div>

      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={title}
            className="mx-auto size-8 justify-center p-2 [&>span]:hidden"
          >
            <Link href={href} onClick={closeSidebar}>
              <Icon />
              <span>{title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
