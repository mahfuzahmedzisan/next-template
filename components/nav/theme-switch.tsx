"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { menuPanelMotion } from "@/components/nav/menu-motion";
import { Button } from "@/components/ui/button";
import { applyThemePreference } from "@/lib/theme/persist-theme";
import type { ThemePreference } from "@/types/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "cn";

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

function ThemeMenuItems({
  onSelect,
}: {
  onSelect: (value: ThemePreference) => void;
}) {
  return themes.map(({ value, label, icon: Icon }) => (
    <DropdownMenuItem key={value} onClick={() => onSelect(value)}>
      <Icon />
      {label}
    </DropdownMenuItem>
  ));
}

export function ThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const { state, isMobile } = useSidebar();
  const iconMode = state === "collapsed" && !isMobile;
  const active = mounted ? theme : undefined;

  function selectTheme(value: ThemePreference) {
    applyThemePreference(setTheme, value, { persistAccount: true });
  }

  if (iconMode) {
    const label =
      mounted && resolvedTheme ? `Theme: ${resolvedTheme}` : "Toggle theme";

    return (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8"
              aria-label={label}
            >
              <Sun className="scale-100 rotate-0 transition-transform duration-200 dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute scale-0 rotate-90 transition-transform duration-200 dark:scale-100 dark:rotate-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={8}
            className={cn(
              menuPanelMotion,
              "data-[state=open]:slide-in-from-left-2 data-[state=closed]:slide-out-to-left-2",
            )}
          >
            <ThemeMenuItems onSelect={selectTheme} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1 rounded-lg bg-sidebar-accent p-1"
    >
      {themes.map(({ value, label, icon: Icon }) => {
        const selected = active === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            title={label}
            onClick={() => selectTheme(value)}
            className={cn(
              "flex h-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors duration-200 hover:text-sidebar-foreground",
              selected && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
