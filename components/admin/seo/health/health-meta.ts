import type { SeoCheckPriority } from "@/lib/admin/seo-audit-types";

export function scoreTone(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function scoreBar(score: number | null) {
  if (score === null) return "[&_[data-slot=progress-indicator]]:bg-muted-foreground/40";
  if (score >= 90) return "[&_[data-slot=progress-indicator]]:bg-emerald-500";
  if (score >= 70) return "[&_[data-slot=progress-indicator]]:bg-amber-500";
  return "[&_[data-slot=progress-indicator]]:bg-destructive";
}

/** Chart fill matching `scoreTone`; the tokens switch with the theme. */
export function scoreFill(score: number | null) {
  if (score === null) return "var(--muted-foreground)";
  if (score >= 90) return "var(--score-good)";
  if (score >= 70) return "var(--score-warn)";
  return "var(--score-bad)";
}

export const PRIORITY_LABELS: Record<SeoCheckPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `~${hours} h`;
}

export function typeLabel(kind: "page" | "model", pageType: string) {
  if (kind === "page") return "Static";
  return pageType.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
