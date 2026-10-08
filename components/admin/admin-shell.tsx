"use client";

import { Globe, LogOut, Settings, Shield, ShieldCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { AppContent } from "@/components/layout/app-content";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { HeaderUser } from "@/components/nav/header-user";
import { SidebarPromo } from "@/components/nav/sidebar-promo";
import { ModeToggle } from "@/components/mode-toggle";
import { adminNav } from "@/lib/admin/nav";
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
  if (pathname.startsWith("/admin/settings")) {
    return [
      { title: "Dashboard", href: "/admin" },
      { title: "Settings" },
    ];
  }

  return [{ title: "Dashboard" }];
}

export function AdminShell({
  user,
  onLogout,
  defaultOpen = true,
  children,
}: {
  user: UserSummary;
  onLogout: () => void | Promise<void>;
  defaultOpen?: boolean;
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

  return (
    <AppShell defaultOpen={defaultOpen}>
      <AppSidebar
        brand={{
          href: "/admin",
          label: "Mahfuz Ahmed",
          icon: <ShieldCheck className="size-4" />,
        }}
        groups={adminNav}
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
            actions={
              <>
                <HeaderUser user={user} groups={menu} />
                <ModeToggle persistAccount />
              </>
            }
          />
        }
      >
        {children}
      </AppContent>
    </AppShell>
  );
}
