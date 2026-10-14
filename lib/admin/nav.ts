import { Activity, Database, History, Images, LayoutDashboard, Mail, MonitorSmartphone, Radio, ScrollText, Search, Settings, Settings2, Shield, SlidersHorizontal, UserRound } from "lucide-react";

import { modules } from "@/lib/modules";
import type { NavGroup, NavItem } from "@/lib/nav";

type ToggleableNavItem = NavItem & { enabled?: boolean; children?: ToggleableNavItem[] };
type ToggleableNavGroup = { label: string; items: ToggleableNavItem[] };

const rawAdminNav: ToggleableNavGroup[] = [
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
        enabled: modules.realtime,
      },
      {
        title: "Media",
        href: "/admin/media",
        icon: Images,
        enabled: modules.media,
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
            title: "SEO",
            href: "/admin/application/seo",
            icon: Search,
          },
          {
            title: "SEO health",
            href: "/admin/application/seo-health",
            icon: Activity,
            enabled: modules.seoHealth,
          },
          {
            title: "Database backup",
            href: "/admin/application/backup",
            icon: Database,
            enabled: modules.backups,
          },
          {
            title: "Audit",
            href: "/admin/application/audit",
            icon: ScrollText,
            enabled: modules.audit,
          },
        ].filter((item) => item.enabled !== false),
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

function stripDisabled(items: ToggleableNavItem[]): NavItem[] {
  return items
    .filter((item) => item.enabled !== false)
    .map(({ enabled: _enabled, children, ...rest }) => ({
      ...rest,
      ...(children ? { children: stripDisabled(children) } : {}),
    }));
}

export const adminNav: NavGroup[] = rawAdminNav.map((group) => ({
  label: group.label,
  items: stripDisabled(group.items),
}));
