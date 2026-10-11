import { Database, History, Images, LayoutDashboard, Mail, MonitorSmartphone, Radio, ScrollText, Settings, Settings2, Shield, SlidersHorizontal, UserRound } from "lucide-react";

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
    label: "Application",
    items: [
      {
        title: "Application settings",
        href: "/admin/application",
        icon: SlidersHorizontal,
        children: [
          {
            title: "General",
            href: "/admin/application",
            icon: Settings2,
          },
          {
            title: "SMTP",
            href: "/admin/application/smtp",
            icon: Mail,
          },
          {
            title: "Database backup",
            href: "/admin/application/backup",
            icon: Database,
          },
          {
            title: "Audit",
            href: "/admin/application/audit",
            icon: ScrollText,
          },
        ],
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
        title: "Devices",
        href: "/admin/devices",
        icon: MonitorSmartphone,
      },
      {
        title: "My activity",
        href: "/admin/activity",
        icon: History,
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];
