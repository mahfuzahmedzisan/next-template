"use server";

import { toResult } from "@/lib/actions/result";
import { getStats, isStatRange } from "@/lib/admin/stats";
import type { StatsActionResult, StatsByKind, StatsKind } from "@/lib/admin/stats-types";

const KINDS: StatsKind[] = ["audit", "media", "backups", "profile"];

/** Range toggles and live refreshes call this; Laravel enforces who may read what. */
export async function loadStatsAction<K extends StatsKind>(
  kind: K,
  days: number,
  timeZone: string,
): Promise<StatsActionResult<StatsByKind[K]>> {
  if (!KINDS.includes(kind) || !isStatRange(days)) {
    return { ok: false, message: "Unsupported chart range." };
  }

  try {
    return { ok: true, data: await getStats(kind, { days, timeZone }) };
  } catch (error) {
    return { ok: false, message: toResult(error, "Unable to load chart data.").message };
  }
}
