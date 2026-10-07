"use client";

import { ChevronRight } from "lucide-react";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { usePathname } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";

import { menuPanelMotion } from "@/components/nav/menu-motion";
import { NavIcon } from "@/components/nav/nav-icon";
import { useCloseSidebar } from "@/components/nav/use-close-sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "@/lib/nav";

const iconFit =
  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:[&>span:last-child]:hidden";

function useLocationHash() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("hashchange", onStoreChange);
      return () => window.removeEventListener("hashchange", onStoreChange);
    },
    () => window.location.hash,
    () => "",
  );
}

function isHrefActive(pathname: string, hash: string, href?: string) {
  if (!href) return false;

  const [path, fragment] = href.split("#");
  if (path === "/admin") return pathname === "/admin";
  if (pathname !== path) return false;
  if (!fragment) return true;
  return hash === `#${fragment}`;
}

function branchIsActive(pathname: string, hash: string, item: NavItem) {
  if (isHrefActive(pathname, hash, item.href)) return true;
  return (
    item.children?.some((child) => isHrefActive(pathname, hash, child.href)) ??
    false
  );
}

function NavLeaf({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const hash = useLocationHash();
  const closeSidebar = useCloseSidebar();
  const active = isHrefActive(pathname, hash, item.href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.title}
        className={iconFit}
      >
        <Link href={item.href ?? "#"} onClick={closeSidebar}>
          <NavIcon icon={item.icon} />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function CollapsedBranch({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const hash = useLocationHash();
  const closeSidebar = useCloseSidebar();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const active = branchIsActive(pathname, hash, item);

  function openNow() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon() {
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  }

  return (
    <SidebarMenuItem>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            isActive={active}
            className={iconFit}
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
            onFocus={openNow}
          >
            <NavIcon icon={item.icon} />
            <span className="sr-only">{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={8}
          className={cn(
            menuPanelMotion,
            "data-[state=open]:slide-in-from-left-2 data-[state=closed]:slide-out-to-left-2",
          )}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
          {item.children?.map((child) => (
            <DropdownMenuItem
              key={child.href ?? child.title}
              asChild
              className="gap-2 px-2 py-1.5"
            >
              <Link href={child.href ?? "#"} onClick={closeSidebar}>
                <NavIcon icon={child.icon} />
                {child.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function ExpandedBranch({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const hash = useLocationHash();
  const closeSidebar = useCloseSidebar();
  const active = branchIsActive(pathname, hash, item);

  return (
    <Collapsible
      key={active ? "active" : "idle"}
      defaultOpen={active}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={active} className={iconFit}>
            <NavIcon icon={item.icon} />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => {
              const childActive = isHrefActive(pathname, hash, child.href);
              return (
                <SidebarMenuSubItem key={child.href ?? child.title}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <Link href={child.href ?? "#"} onClick={closeSidebar}>
                      <NavIcon icon={child.icon} />
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavBranch({ item }: { item: NavItem }) {
  const { state, isMobile } = useSidebar();
  const collapsedDesktop = state === "collapsed" && !isMobile;

  if (collapsedDesktop) return <CollapsedBranch item={item} />;
  return <ExpandedBranch item={item} />;
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const { state, isMobile } = useSidebar();
  const iconMode = state === "collapsed" && !isMobile;

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup
          key={group.label}
          className="group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-1"
        >
          {iconMode ? (
            <SidebarSeparator className="mx-auto my-2 w-4" />
          ) : (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) =>
                item.children?.length ? (
                  <NavBranch key={item.title} item={item} />
                ) : (
                  <NavLeaf key={item.href ?? item.title} item={item} />
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
