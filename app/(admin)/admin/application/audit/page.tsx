import type { AuditFilters } from "@/components/admin/audit/audit-filters";
import { AuditScreen } from "@/components/admin/audit/audit-screen";
import { AUDIT_FILTER_KEYS, getAuditOverview, listAuditEntries, toAuditQuery } from "@/lib/admin/audit";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [overview, list] = await Promise.all([getAuditOverview(), listAuditEntries(toAuditQuery(params))]);

  const filters: AuditFilters = {};
  for (const key of AUDIT_FILTER_KEYS) {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single && single !== "all") filters[key] = single;
  }

  const exportError = typeof params.export_error === "string" ? params.export_error : null;

  return <AuditScreen overview={overview} list={list} filters={filters} exportError={exportError} />;
}
