import { DashboardHome } from "@/components/admin/dashboard-home";
import { getSession } from "@/lib/auth/auth-cookies";

export default async function AdminDashboardPage() {
  const session = await getSession();

  return <DashboardHome user={session?.user} />;
}
