"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { applyThemePreference } from "@/lib/theme/persist-theme"
import type { ThemePreference } from "@/types/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle({
  persistAccount = false,
}: {
  persistAccount?: boolean
}) {
  const { resolvedTheme, setTheme } = useTheme()

  function selectTheme(value: ThemePreference) {
    applyThemePreference(setTheme, value, { persistAccount })
  }
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const label =
    mounted && resolvedTheme ? `Theme: ${resolvedTheme}` : "Toggle theme"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative size-11">
          <Sun
            aria-hidden="true"
            className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          />
          <Moon
            aria-hidden="true"
            className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => selectTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
