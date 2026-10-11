export type AccountTab = "profile" | "security" | "devices" | "activity" | "settings";

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
    id: "devices",
    href: "/admin/devices",
    title: "Devices",
    description: "Signed-in devices and sign-in history.",
  },
  {
    id: "activity",
    href: "/admin/activity",
    title: "Activity",
    description: "Sign-ins, security and account changes.",
  },
  {
    id: "settings",
    href: "/admin/settings",
    title: "Settings",
    description: "Theme and notification preferences.",
  },
];
