import { iconNames } from "lucide-react/dynamic"

const VALID_LUCIDE_KEYS = new Set<string>(iconNames)
const DEFAULT_ICON_KEY = "pen-line"

export type IconKey = string

const ICON_ALIASES: Record<string, string> = {
  funnel: "filter",
}

function normalizeIconKey(value: string): string {
  return ICON_ALIASES[value] ?? value
}

export function isIconKey(value: string | null | undefined): value is IconKey {
  return Boolean(value && VALID_LUCIDE_KEYS.has(value))
}

export function isValidLucideIconKey(value: string | null | undefined): boolean {
  return Boolean(value && VALID_LUCIDE_KEYS.has(value))
}

export function resolveIconKey(
  value: string | null | undefined,
  fallback: string = DEFAULT_ICON_KEY,
): string {
  const safeFallback = VALID_LUCIDE_KEYS.has(fallback) ? fallback : DEFAULT_ICON_KEY

  if (!value) {
    return safeFallback
  }

  const normalized = normalizeIconKey(value)

  if (VALID_LUCIDE_KEYS.has(normalized)) {
    return normalized
  }

  return safeFallback
}

export function getIconLabel(key: string): string {
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
