"use client";

import { menuPanelMotion } from "@/components/nav/menu-motion";
import { UserInfo } from "@/components/user-info";
import { UserMenuContent } from "@/components/user-menu-content";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { UserMenuGroup, UserSummary } from "@/lib/nav";

export function HeaderUser({
  user,
  groups,
}: {
  user: UserSummary;
  groups: UserMenuGroup[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto min-h-9 max-w-56 gap-2 px-1.5 max-sm:size-9 max-sm:px-0 max-sm:[&_div]:hidden"
          aria-label="Account menu"
        >
          <UserInfo user={user} showEmail />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(menuPanelMotion, "rounded-xl")}
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <UserMenuContent user={user} groups={groups} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
