import { SeoHealthScreen } from "@/components/admin/seo/health/seo-health-screen";
import { getSeoAuditLatest, listSeoAudits } from "@/lib/admin/seo";

export default async function SeoHealthPage() {
  const [latest, history] = await Promise.all([getSeoAuditLatest(), listSeoAudits()]);
  return <SeoHealthScreen initialLatest={latest} initialHistory={history} />;
}
