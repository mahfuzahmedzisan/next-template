import { DashboardHome } from "@/components/admin/dashboard-home";
import { getStatsOrNull } from "@/lib/admin/stats";
import { getSession } from "@/lib/auth/auth-cookies";
import { RouteReady } from "@/components/transitions/route-ready";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const isAdmin = session?.user?.role === "admin";

  const [audit, media, personal] = await Promise.all([
    isAdmin ? getStatsOrNull("audit") : null,
    isAdmin ? getStatsOrNull("media") : null,
    session && !isAdmin ? getStatsOrNull("profile") : null,
  ]);

  return <><RouteReady /><DashboardHome user={session?.user} stats={{ audit, media, personal }} /></>;
}
