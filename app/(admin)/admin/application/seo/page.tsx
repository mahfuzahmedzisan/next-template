import { SeoScreen } from "@/components/admin/seo/seo-screen";
import { getSeoOverview } from "@/lib/admin/seo";

export default async function SeoSettingsPage({ searchParams }: PageProps<"/admin/application/seo">) {
  const [overview, params] = await Promise.all([getSeoOverview(), searchParams]);
  const pageId = typeof params.page === "string" ? Number(params.page) : null;

  return <SeoScreen initial={overview} openPageId={Number.isInteger(pageId) ? pageId : null} />;
}
