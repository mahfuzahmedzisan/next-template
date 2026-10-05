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
        title: "Account",
        icon: UserRound,
        children: [
          {
            title: "Profile",
            href: "/admin/profile",
            icon: UserRound,
          },
          {
            title: "Security",
            href: "/admin/profile#security",
            icon: Shield,
          },
          {
            title: "Settings",
            href: "/admin/profile#settings",
            icon: Settings,
          },
        ],
      },
    ],
  },
];
