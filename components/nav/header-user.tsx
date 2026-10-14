"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { menuPanelMotion } from "@/components/nav/menu-motion";
import { UserInfo } from "@/components/user-info";
import { UserMenuContent } from "@/components/user-menu-content";
import { cn } from "cn";
import type { UserMenuGroup, UserSummary } from "@/lib/nav";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function HeaderUser({
  user,
  groups,
  avatarOnly = false,
}: {
  user: UserSummary;
  groups: UserMenuGroup[];
  /** Collapsed-sidebar style: avatar only, no name/email in the trigger. */
  avatarOnly?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={avatarOnly ? "icon" : "default"}
          className={
            avatarOnly
              ? "size-9 rounded-full p-0"
              : "h-auto min-h-9 max-w-56 gap-2 px-1.5 max-sm:size-9 max-sm:px-0 max-sm:[&_div]:hidden"
          }
          aria-label="Account menu"
        >
          {avatarOnly ? (
            <Avatar size="sm">
              {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
          ) : (
            <UserInfo user={user} showEmail />
          )}
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
