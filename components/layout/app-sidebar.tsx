"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { NavMain } from "@/components/nav/nav-main";
import { NavUser } from "@/components/nav/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { NavGroup, UserMenuGroup, UserSummary } from "@/lib/nav";

const iconFit =
  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:[&>span:last-child]:hidden";

export function AppSidebar({
  brand,
  groups,
  promo,
  user,
  menu,
}: {
  brand: { href: string; label: string; icon: ReactNode };
  groups: NavGroup[];
  promo?: ReactNode;
  user: UserSummary;
  menu: UserMenuGroup[];
}) {
  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="**:data-[sidebar=sidebar]:rounded-2xl **:data-[sidebar=sidebar]:border **:data-[sidebar=sidebar]:border-sidebar-border/80 **:data-[sidebar=sidebar]:bg-sidebar/90 **:data-[sidebar=sidebar]:shadow-sm **:data-[sidebar=sidebar]:backdrop-blur-md"
    >
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={brand.label} className={iconFit}>
              <Link href={brand.href}>
                <span className="flex size-4 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  {brand.icon}
                </span>
                <span className="font-heading font-semibold">{brand.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>

      <SidebarFooter>
        {promo}
        <NavUser user={user} groups={menu} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
