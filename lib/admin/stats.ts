import "server-only";

import { unstable_rethrow } from "next/navigation";

import { authedRequest } from "@/lib/auth/api";
import {
  DEFAULT_STAT_RANGE,
  STAT_RANGES,
  type StatRange,
  type StatsByKind,
  type StatsKind,
} from "@/lib/admin/stats-types";

const STATS_PATHS: Record<StatsKind, string> = {
  audit: "/admin/audit/trend",
  media: "/admin/media/stats",
  backups: "/admin/backups/history",
  profile: "/profile/activity/stats",
};

export function isStatRange(value: unknown): value is StatRange {
  return STAT_RANGES.includes(value as StatRange);
}

/**
 * Daily stats for one screen. Without `timeZone` the API uses the account
 * preference, then UTC; the client refetches if its display zone differs.
 */
export function getStats<K extends StatsKind>(
  kind: K,
  options: { days?: StatRange; timeZone?: string } = {},
): Promise<StatsByKind[K]> {
  const params = new URLSearchParams({ days: String(options.days ?? DEFAULT_STAT_RANGE) });
  if (options.timeZone) params.set("tz", options.timeZone.slice(0, 64));

  return authedRequest<StatsByKind[K]>("get", `${STATS_PATHS[kind]}?${params.toString()}`);
}

/** For page loads: a failed stats call hides the chart instead of failing the page. */
export async function getStatsOrNull<K extends StatsKind>(
  kind: K,
  options: { days?: StatRange; timeZone?: string } = {},
): Promise<StatsByKind[K] | null> {
  try {
    return await getStats(kind, options);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
