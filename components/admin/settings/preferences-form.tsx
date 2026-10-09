"use client";

import { Bell, Mail, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { updatePreferencesAction } from "@/app/(admin)/admin/profile/actions";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { timeZoneOptions, useDetectedTimeZone } from "@/lib/datetime/timezone";
import { applyThemePreference } from "@/lib/theme/persist-theme";
import { cn } from "@/lib/utils";
import type { ThemePreference, User } from "@/types/auth";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function PreferencesForm({ user }: { user: User }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [pending, startTransition] = useTransition();
  const [emailNotifications, setEmailNotifications] = useState(
    user.email_notifications ?? true,
  );
  const [pushNotifications, setPushNotifications] = useState(
    user.push_notifications ?? false,
  );
  const [timezone, setTimezone] = useState(user.timezone ?? "auto");
  const detectedZone = useDetectedTimeZone();
  const zones = useMemo(
    () => ["auto", ...timeZoneOptions()],
    [],
  );
  const active = mounted ? theme : undefined;

  function save(partial: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    theme?: ThemePreference;
    timezone?: string | null;
  }) {
    startTransition(async () => {
      const result = await updatePreferencesAction(partial);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-sm font-medium">Theme</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how the workspace looks. Saved to your account.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {themes.map(({ value, label, icon: Icon }) => {
            const selected = active === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  applyThemePreference(setTheme, value, {
                    persistAccount: true,
                  })
                }
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-colors disabled:opacity-60",
                  selected
                    ? "border-foreground/20 bg-background shadow-sm"
                    : "border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Notifications</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Delivery preferences stored with your account.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card">
                <Mail className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Email notifications</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Account and security updates by email.
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              disabled={pending}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                save({ email_notifications: checked });
              }}
              aria-label="Email notifications"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card">
                <Bell className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Push notifications</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Browser alerts when you are signed in.
                </p>
              </div>
            </div>
            <Switch
              checked={pushNotifications}
              disabled={pending}
              onCheckedChange={(checked) => {
                setPushNotifications(checked);
                save({ push_notifications: checked });
              }}
              aria-label="Push notifications"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-sm font-medium">Time zone</Label>
        <p className="text-sm text-muted-foreground">
          Auto follows this browser. A saved zone only changes how dates are shown for you.
        </p>
        <Combobox
          items={zones}
          value={timezone}
          disabled={pending}
          itemToStringLabel={(zone) =>
            zone === "auto" ? `Auto · ${detectedZone}` : zone
          }
          onValueChange={(next) => {
            if (!next) return;
            setTimezone(next);
            save({ timezone: next === "auto" ? null : next });
          }}
        >
          <ComboboxInput
            id="timezone"
            placeholder="Search time zones"
            className="w-full"
            disabled={pending}
          />
          <ComboboxContent>
            <ComboboxEmpty>No time zone found.</ComboboxEmpty>
            <ComboboxList>
              {(zone: string) => (
                <ComboboxItem key={zone} value={zone}>
                  {zone === "auto" ? `Auto · ${detectedZone}` : zone}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}
