import { Images, LayoutDashboard, Radio, Settings, Shield, UserRound } from "lucide-react";

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
      {
        title: "Realtime",
        href: "/admin/realtime",
        icon: Radio,
      },
      {
        title: "Media",
        href: "/admin/media",
        icon: Images,
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
