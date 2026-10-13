"use client";

import { Globe, History, LogOut, MonitorSmartphone, Settings, Shield, ShieldCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { AppContent } from "@/components/layout/app-content";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { HeaderUser } from "@/components/nav/header-user";
import { SidebarPromo } from "@/components/nav/sidebar-promo";
import { adminNav } from "@/lib/admin/nav";
import { TimezoneProvider } from "@/lib/datetime/timezone";
import type { BreadcrumbItem, UserMenuGroup, UserSummary } from "@/lib/nav";
import { useTransitionController } from "@/components/transitions/transition-provider";

function breadcrumbsFor(pathname: string): BreadcrumbItem[] {
  if (pathname.startsWith("/admin/realtime")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Realtime" },
    ];
  }
  if (pathname.startsWith("/admin/media")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Media" },
    ];
  }
  if (pathname.startsWith("/admin/profile")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Profile" },
    ];
  }
  if (pathname.startsWith("/admin/security")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Security" },
    ];
  }
  if (pathname.startsWith("/admin/devices")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Devices" },
    ];
  }
  if (pathname.startsWith("/admin/activity")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "My activity" },
    ];
  }
  if (pathname.startsWith("/admin/settings")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Settings" },
    ];
  }
  if (pathname.startsWith("/admin/application")) {
    const sections: [string, string][] = [
      ["/admin/application/smtp", "SMTP"],
      ["/admin/application/seo-health", "SEO health"],
      ["/admin/application/seo", "SEO"],
      ["/admin/application/backup", "Database backup"],
      ["/admin/application/audit", "Audit"],
    ];
    const section = sections.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "General";
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Application settings", href: "/admin/application" },
      { title: section },
    ];
  }

  return [{ title: "Dashboard" }];
}

export function AdminShell({
  user,
  onLogout,
  defaultOpen = true,
  brandLabel = "Next Template",
  logoUrl = null,
  children,
}: {
  user: UserSummary;
  onLogout: () => void | Promise<void>;
  defaultOpen?: boolean;
  brandLabel?: string;
  logoUrl?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { runTransitionAction } = useTransitionController();
  const menu = useMemo<UserMenuGroup[]>(
    () => [
      {
        label: "Account",
        items: [
          { title: "Profile", href: "/admin/profile", icon: UserRound },
          { title: "Security", href: "/admin/security", icon: Shield },
          { title: "Devices", href: "/admin/devices", icon: MonitorSmartphone },
          { title: "My activity", href: "/admin/activity", icon: History },
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

  const groups = user.role === "admin"
    ? adminNav
    : adminNav
        .filter((group) => group.label !== "Application")
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.href !== "/admin/realtime"),
        }));

  return (
    <AppShell defaultOpen={defaultOpen}>
      <AppSidebar
        brand={{
          href: "/admin",
          label: brandLabel,
          icon: logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- brand file is served from this app
            <img src={logoUrl} alt="" className="size-4 rounded-sm object-contain" />
          ) : (
            <ShieldCheck className="size-4" />
          ),
        }}
        groups={groups}
        promo={
          <SidebarPromo
            title="Public site"
            description="The portfolio stays separate from this workspace."
            href="/"
            action="Open site"
            icon={Globe}
          />
        }
        user={user}
        menu={menu}
      />
      <AppContent
        header={
          <AppHeader
            breadcrumbs={breadcrumbsFor(pathname)}
            actions={<HeaderUser user={user} groups={menu} />}
          />
        }
      >
        <TimezoneProvider preference={user.timezone}>{children}</TimezoneProvider>
      </AppContent>
    </AppShell>
  );
}
