"use client";

import {
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";

import { HeaderUser } from "@/components/nav/header-user";
import type { UserMenuGroup, UserSummary } from "@/lib/nav";
import { useTransitionController } from "@/components/transitions/transition-provider";

export function SiteHeaderAccount({
  user,
  onLogout,
}: {
  user: UserSummary;
  onLogout: () => void | Promise<void>;
}) {
  const { runTransitionAction } = useTransitionController();
  const menu = useMemo<UserMenuGroup[]>(
    () => [
      {
        label: "Workspace",
        items: [
          { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
          { title: "Profile", href: "/admin/profile", icon: UserRound },
          { title: "Security", href: "/admin/security", icon: Shield },
          { title: "Settings", href: "/admin/settings", icon: Settings },
        ],
      },
      {
        label: "Session",
        items: [
          {
            title: "Log out",
            icon: LogOut,
            variant: "destructive",
            onSelect: () => {
              void runTransitionAction(onLogout);
            },
          },
        ],
      },
    ],
    [onLogout, runTransitionAction],
  );

  return <HeaderUser user={user} groups={menu} avatarOnly />;
}
