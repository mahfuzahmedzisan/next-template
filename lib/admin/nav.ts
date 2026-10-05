import { LayoutDashboard, Settings, Shield, UserRound } from "lucide-react";

import type { NavGroup } from "@/lib/nav";

export const adminNav: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Profile",
        href: "/admin/profile",
        icon: UserRound,
      },
      {
        title: "Security",
        href: "/admin/security",
        icon: Shield,
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];
