import { HelpCircle, Monitor, Smartphone, Tablet } from "lucide-react";

import type { DeviceRevokedReason, UserDevice } from "@/types/auth";

const ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle,
} as const;

export function DeviceIcon({ type }: { type: UserDevice["device_type"] }) {
  const Icon = ICONS[type] ?? HelpCircle;
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
    </span>
  );
}

export function deviceLabel(device: UserDevice) {
  if (!device.browser && !device.platform) return "Unknown device";
  if (!device.platform) return device.browser as string;
  if (!device.browser) return device.platform;
  return `${device.browser} on ${device.platform}`;
}

const REASONS: Record<DeviceRevokedReason, string> = {
  signed_out: "Signed out",
  revoked: "Revoked",
  signed_out_everywhere: "Signed out everywhere",
  password_changed: "Password changed",
  password_reset: "Password reset",
};

export function inactiveLabel(device: UserDevice) {
  if (device.status === "expired") return "Expired";
  return device.revoked_reason ? REASONS[device.revoked_reason] : "Revoked";
}

export function formatDateTime(value: string | null, timeZone: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}
