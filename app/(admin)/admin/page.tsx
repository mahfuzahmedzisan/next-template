import { DashboardHome } from "@/components/admin/dashboard-home";
import { getSession } from "@/lib/auth/auth-cookies";
import { RouteReady } from "@/components/transitions/route-ready";

export default async function AdminDashboardPage() {
  const session = await getSession();

  return <><RouteReady /><DashboardHome user={session?.user} /></>;
}
