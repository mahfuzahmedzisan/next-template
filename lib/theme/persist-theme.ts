"use client";

import { toast } from "sonner";

import { updatePreferencesAction } from "@/app/(admin)/admin/profile/actions";
import type { ThemePreference } from "@/types/auth";

const THEME_STORAGE_KEY = "theme";

let latestTheme: ThemePreference | null = null;
let saving = false;

export function readStoredTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return null;
}

function saveAccountTheme(value: ThemePreference) {
  latestTheme = value;
  if (saving) return;

  saving = true;
  void drainThemeSaves();
}

async function drainThemeSaves() {
  try {
    while (latestTheme) {
      const next = latestTheme;
      latestTheme = null;
      const result = await updatePreferencesAction({ theme: next });
      if (latestTheme) continue;
      if (!result.ok) toast.error(result.message);
    }
  } finally {
    saving = false;
    if (latestTheme) {
      saving = true;
      void drainThemeSaves();
    }
  }
}

/** Paints immediately. Account save runs in the background and never flips the UI. */
export function applyThemePreference(
  setTheme: (value: string) => void,
  value: ThemePreference,
  options?: { persistAccount?: boolean },
) {
  setTheme(value);
  if (options?.persistAccount) saveAccountTheme(value);
}

/**
 * After sign-in, push the browser theme to the account when they differ.
 * Never applies the account theme onto the page.
 */
export async function syncStoredThemeToAccount(
  accountTheme?: ThemePreference | null,
) {
  const local = readStoredTheme();
  if (!local || local === accountTheme) return;

  const result = await updatePreferencesAction({ theme: local });
  if (!result.ok) toast.error(result.message);
}
