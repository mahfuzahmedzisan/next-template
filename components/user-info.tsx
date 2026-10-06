"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserSummary } from "@/lib/nav";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserInfo({
  user,
  showEmail = false,
}: {
  user: UserSummary;
  showEmail?: boolean;
}) {
  return (
    <>
      <Avatar>
        {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail ? (
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        ) : null}
      </div>
    </>
  );
}
