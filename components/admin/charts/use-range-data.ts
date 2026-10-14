"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadStatsAction } from "@/app/(admin)/chart-actions";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";
import { DEFAULT_STAT_RANGE, type StatRange, type StatsByKind, type StatsKind } from "@/lib/admin/stats-types";

/**
 * Chart data for one stats endpoint plus its 7/30/90-day range. Old data
 * stays on screen while a new range loads. The page fetches with the account
 * timezone, so if the display timezone differs the data is fetched again.
 *
 * Without initial data, `autoLoad` fetches on mount. Changing `refreshKey`
 * refetches the current range (after an upload, for example).
 */
export function useRangeData<K extends StatsKind>(
  kind: K,
  initial: StatsByKind[K] | null,
  options: { autoLoad?: boolean; refreshKey?: unknown } = {},
) {
  const { autoLoad = false, refreshKey } = options;
  const timeZone = useDisplayTimeZone();
  const [data, setData] = useState(initial);
  const [days, setDays] = useState<StatRange>(initial?.days ?? DEFAULT_STAT_RANGE);
  const [pending, setPending] = useState(autoLoad && initial === null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const fetchRange = useCallback(
    async (range: StatRange) => {
      const request = ++latest.current;
      const result = await loadStatsAction(kind, range, timeZone);
      if (request !== latest.current) return;

      setPending(false);
      if (result.ok) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    },
    [kind, timeZone],
  );

  const selectRange = useCallback(
    (range: StatRange) => {
      setDays(range);
      setPending(true);
      void fetchRange(range);
    },
    [fetchRange],
  );

  const reload = useCallback(() => {
    setPending(true);
    void fetchRange(days);
  }, [days, fetchRange]);

  const autoLoaded = useRef(false);

  useEffect(() => {
    if (!autoLoad || initial !== null || autoLoaded.current) return;
    autoLoaded.current = true;
    void fetchRange(days);
  }, [autoLoad, initial, days, fetchRange]);

  const lastRefreshKey = useRef(refreshKey);

  useEffect(() => {
    if (Object.is(lastRefreshKey.current, refreshKey)) return;
    lastRefreshKey.current = refreshKey;
    void fetchRange(days);
  }, [refreshKey, days, fetchRange]);

  const zoneMismatch = data !== null && data.timezone !== timeZone;
  const syncedZone = useRef<string | null>(null);

  useEffect(() => {
    // Once per display timezone: if the API falls back to UTC for a zone it
    // does not know, the mismatch stays and must not refetch forever.
    if (!zoneMismatch || syncedZone.current === timeZone) return;
    syncedZone.current = timeZone;
    void fetchRange(days);
  }, [zoneMismatch, timeZone, days, fetchRange]);

  return { data, days, timeZone, pending, error, selectRange, reload };
}
