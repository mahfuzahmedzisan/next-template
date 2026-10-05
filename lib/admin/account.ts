export type AccountTab = "profile" | "security" | "settings";

export const accountTabs: {
  id: AccountTab;
  href: string;
  title: string;
  description: string;
}[] = [
  {
    id: "profile",
    href: "/admin/profile",
    title: "Profile",
    description: "Your photo, name, and email.",
  },
  {
    id: "security",
    href: "/admin/security",
    title: "Security",
    description: "Password, two-factor, and account deletion.",
  },
  {
    id: "settings",
    href: "/admin/settings",
    title: "Settings",
    description: "Theme and notification preferences.",
  },
];
