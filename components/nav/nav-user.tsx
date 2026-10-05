"use client";

import { ChevronsUpDown } from "lucide-react";

import { menuPanelMotion } from "@/components/nav/menu-motion";
import { UserInfo } from "@/components/user-info";
import { UserMenuContent } from "@/components/user-menu-content";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { UserMenuGroup, UserSummary } from "@/lib/nav";

const iconFit =
  "data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>div]:hidden group-data-[collapsible=icon]:[&>svg]:hidden";

export function NavUser({
  user,
  groups,
}: {
  user: UserSummary;
  groups: UserMenuGroup[];
}) {
  const { state, isMobile } = useSidebar();
  const side = !isMobile && state === "collapsed" ? "right" : "top";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className={iconFit}>
              <UserInfo user={user} showEmail />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn(
              menuPanelMotion,
              "rounded-xl",
              side === "right" &&
                "data-[state=open]:slide-in-from-left-2 data-[state=closed]:slide-out-to-left-2",
            )}
            side={side}
            align="end"
            sideOffset={8}
          >
            <UserMenuContent user={user} groups={groups} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
