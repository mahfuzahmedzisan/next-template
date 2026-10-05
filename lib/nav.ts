import type { LucideIcon } from "lucide-react";

/** Lucide component, image/SVG URL, or a raw `<svg>` markup string from config. */
export type NavIcon = LucideIcon | string;

export type NavItem = {
  title: string;
  href?: string;
  icon: NavIcon;
  children?: NavItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type MenuIcon = NavIcon;

export type UserSummary = {
  id?: string | number;
  name: string;
  email: string;
  avatar?: string | null;
};

export type UserMenuItem = {
  title: string;
  href?: string;
  icon?: MenuIcon;
  onSelect?: () => void;
  variant?: "default" | "destructive";
};

export type UserMenuGroup = {
  label: string;
  items: UserMenuItem[];
};

export type BreadcrumbItem = {
  title: string;
  href?: string;
};
