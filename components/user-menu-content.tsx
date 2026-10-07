"use client";

import { TransitionLink as Link } from "@/components/transitions/transition-link";

import { NavIcon } from "@/components/nav/nav-icon";
import { useCloseSidebar } from "@/components/nav/use-close-sidebar";
import { UserInfo } from "@/components/user-info";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { UserMenuGroup, UserSummary } from "@/lib/nav";

export function UserMenuContent({
  user,
  groups,
}: {
  user: UserSummary;
  groups: UserMenuGroup[];
}) {
  const closeSidebar = useCloseSidebar();

  return (
    <>
      <div className="flex items-center gap-2 px-1.5 py-2">
        <UserInfo user={user} showEmail />
      </div>
      {groups.map((group) => (
        <div key={group.label}>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
          <DropdownMenuGroup>
            {group.items.map((item) =>
              item.href ? (
                <DropdownMenuItem key={item.title} asChild>
                  <Link href={item.href} onClick={closeSidebar}>
                    {item.icon ? <NavIcon icon={item.icon} /> : null}
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={item.title}
                  variant={item.variant ?? "default"}
                  onSelect={() => item.onSelect?.()}
                >
                  {item.icon ? <NavIcon icon={item.icon} /> : null}
                  {item.title}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuGroup>
        </div>
      ))}
    </>
  );
}
