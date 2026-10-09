"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

const TimezoneContext = createContext<string | null>(null);

function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function useDetectedTimeZone() {
  return useSyncExternalStore(
    () => () => {},
    detectTimeZone,
    () => "UTC",
  );
}

export function TimezoneProvider({
  preference,
  children,
}: {
  preference?: string | null;
  children: ReactNode;
}) {
  const detected = useDetectedTimeZone();
  const zone = preference && preference.length > 0 ? preference : detected;

  return <TimezoneContext.Provider value={zone}>{children}</TimezoneContext.Provider>;
}

export function useDisplayTimeZone() {
  const fromContext = useContext(TimezoneContext);
  const detected = useDetectedTimeZone();
  return fromContext ?? detected;
}

export function formatInZone(value: string | null, timeZone: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
}

export function timeZoneOptions() {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return Intl.supportedValuesOf("timeZone");
  }

  return ["UTC"];
}
