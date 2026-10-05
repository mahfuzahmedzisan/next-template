"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import type { ThemePreference } from "@/types/auth";

/** Applies the account theme preference once after mount. */
export function AccountThemeSync({
  theme,
}: {
  theme?: ThemePreference | null;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (theme) setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
