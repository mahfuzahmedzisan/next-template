"use server";

import { toResult } from "@/lib/actions/result";
import { getSeoAuditLatest, getSeoAuditPage, listSeoAudits, startSeoAudit } from "@/lib/admin/seo";
import type { SeoAuditCheck, SeoAuditLatest, SeoAuditPageRow, SeoAuditRow, SeoAuditScope } from "@/lib/admin/seo-audit-types";
import { ApiError } from "@/lib/auth/api-error";

type Failure = { ok: false; message: string };

export type AuditLatestResult = { ok: true; message: string; latest: SeoAuditLatest } | (Failure & { latest?: SeoAuditLatest });
export type AuditHistoryResult = { ok: true; audits: SeoAuditRow[] } | Failure;
export type AuditPageResult = { ok: true; page: SeoAuditPageRow & { checks: SeoAuditCheck[] } } | Failure;

export async function startSeoAuditAction(includeNoindex: boolean, scope: SeoAuditScope = "full"): Promise<AuditLatestResult> {
  try {
    return { ok: true, message: "Audit started.", latest: await startSeoAudit(includeNoindex, scope) };
  } catch (error) {
    const result = toResult(error, "Unable to start the audit.") as Failure;
    if (error instanceof ApiError && error.status === 409) {
      const latest = (error.body as { data?: SeoAuditLatest } | undefined)?.data;
      return latest ? { ...result, latest } : result;
    }
    return result;
  }
}

export async function loadSeoAuditLatestAction(): Promise<AuditLatestResult> {
  try {
    return { ok: true, message: "", latest: await getSeoAuditLatest() };
  } catch (error) {
    return toResult(error, "Unable to load the audit.") as Failure;
  }
}

export async function loadSeoAuditHistoryAction(): Promise<AuditHistoryResult> {
  try {
    return { ok: true, audits: await listSeoAudits() };
  } catch (error) {
    return toResult(error, "Unable to load the audit history.") as Failure;
  }
}

export async function loadSeoAuditPageAction(auditId: number, pageId: number): Promise<AuditPageResult> {
  try {
    return { ok: true, page: await getSeoAuditPage(auditId, pageId) };
  } catch (error) {
    return toResult(error, "Unable to load this page's checks.") as Failure;
  }
}
