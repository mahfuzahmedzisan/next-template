import "server-only";

import { authedRequest } from "@/lib/auth/api";
import type {
  AuditDetail,
  AuditListResult,
  AuditOverview,
} from "@/lib/admin/audit-types";

type SessionBehavior = "redirect" | "throw";

/** Filter keys the admin list accepts; each maps to `filter[key]` upstream. */
export const AUDIT_FILTER_KEYS = [
  "q",
  "category",
  "severity",
  "event",
  "causer",
  "subject",
  "involving",
  "ip",
  "request_id",
  "origin",
  "from",
  "to",
] as const;

export type AuditFilterKey = (typeof AUDIT_FILTER_KEYS)[number];

/**
 * Turns flat browser params (`?category=auth&page=2`) into the API's
 * `filter[...]` syntax, dropping anything unknown.
 */
export function toAuditQuery(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  options: { paginate?: boolean } = {},
) {
  const { paginate = true } = options;
  const read = (key: string) => {
    const value = source instanceof URLSearchParams ? source.get(key) : source[key];
    const single = Array.isArray(value) ? value[0] : value;
    return typeof single === "string" ? single.trim() : "";
  };

  const params = new URLSearchParams();
  for (const key of AUDIT_FILTER_KEYS) {
    const value = read(key);
    if (value && value !== "all") params.set(`filter[${key}]`, value.slice(0, 200));
  }

  if (paginate) {
    const page = Number.parseInt(read("page"), 10);
    const perPage = Number.parseInt(read("per_page"), 10);
    if (page > 1) params.set("page", String(page));
    params.set("per_page", String(perPage >= 1 && perPage <= 100 ? perPage : 25));
  }

  return params;
}

export function listAuditEntries(query: URLSearchParams, onSessionExpired: SessionBehavior = "redirect") {
  return authedRequest<AuditListResult>("get", `/admin/audit?${query.toString()}`, undefined, {
    onSessionExpired,
  });
}

export function getAuditOverview() {
  return authedRequest<AuditOverview>("get", "/admin/audit/overview");
}

export async function getAuditEntry(id: number, onSessionExpired: SessionBehavior = "redirect") {
  const data = await authedRequest<{ activity: AuditDetail }>(
    "get",
    `/admin/audit/${id}`,
    undefined,
    { onSessionExpired },
  );
  return data.activity;
}

export function listMyActivity(
  options: { page?: number; perPage?: number; category?: string } = {},
  onSessionExpired: SessionBehavior = "redirect",
) {
  const params = new URLSearchParams({ per_page: String(options.perPage ?? 15) });
  if (options.page && options.page > 1) params.set("page", String(options.page));
  if (options.category) params.set("category", options.category);

  return authedRequest<AuditListResult>("get", `/profile/activity?${params.toString()}`, undefined, {
    onSessionExpired,
  });
}
